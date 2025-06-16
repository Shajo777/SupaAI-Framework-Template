import { OpenAI } from "openai";
import { ai, ChatRole, OpenAIModel } from "@src/integrations/ai/ai.integration.ts";
import { AssistantTool } from "@src/services/assistant/tool.utils.ts";
import { AppErrorCode, handleAppError, throwAppError } from "@src/utils/error/error.utils.ts";
import { updateThread } from "@src/services/assistant/db.utils.ts";
import { AssistantResponse } from "@src/services/assistant/assistant.service.ts";
import { Thread } from "@src/services/assistant/db.utils.ts";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

/**
 * Interfaces
 */

export interface AIExecutionConfig {
  model: OpenAIModel;
  systemMessage: string;
  messages: OpenAI.ChatCompletionMessageParam[];
  tools?: AssistantTool[];
  onToken?: (token: string) => void;
  responseFormat?: {
    schema: z.ZodType;
    name: string;
  };
}

export interface AIExecutionResult {
  message: string;
  toolCalls: OpenAI.ChatCompletionMessageToolCall[] | null;
  userObjectives: string[];
  // Strukturierte Daten aus der AI-Antwort
  structuredData?: unknown;
  // Tracking entity changes
  created?: unknown[];
  updated?: unknown[];
  deleted?: unknown[];
}

/**
 * Schemas
 */

export const taskAnalysisSchema = z.object({
  title: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  estimatedTime: z.number().min(0),
  steps: z.array(z.string()),
  tags: z.array(z.string()),
});

export const summarySchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  actionItems: z.array(z.object({
    task: z.string(),
    responsible: z.string().optional(),
    dueDate: z.string().optional(),
  })),
});

export const codeAnalysisSchema = z.object({
  issues: z.array(z.object({
    type: z.enum(["error", "warning", "suggestion"]),
    message: z.string(),
    line: z.number().optional(),
    severity: z.enum(["low", "medium", "high"]),
  })),
  suggestions: z.array(z.string()),
  complexity: z.enum(["low", "medium", "high"]),
});

export type TaskAnalysis = z.infer<typeof taskAnalysisSchema>;
export type Summary = z.infer<typeof summarySchema>;
export type CodeAnalysis = z.infer<typeof codeAnalysisSchema>;

/**
 * Execution
 */

export async function executeStructuredAICall<T>(
  config: Omit<AIExecutionConfig, "responseFormat">,
  schema: z.ZodType<T>,
  schemaName: string,
): Promise<{ message: string; structuredData: T; userObjectives: string[] }> {
  const result = await executeAICall({
    ...config,
    responseFormat: {
      schema,
      name: schemaName,
    },
  });

  if (!result.structuredData) {
    throw new Error("Keine strukturierten Daten erhalten");
  }

  return {
    message: result.message,
    structuredData: result.structuredData as T,
    userObjectives: result.userObjectives,
  };
}

export async function executeAICall(config: AIExecutionConfig): Promise<AIExecutionResult> {
  try {
    if (config.onToken) {
      return await executeStreamingAICall({
        ...config,
        onToken: config.onToken,
      });
    } else {
      return await executeDefaultAICall(config);
    }
  } catch (error) {
    throw handleAppError(error, {
      message: "AI Execution Error",
      code: AppErrorCode.INTERNAL_ERROR,
    });
  }
}

async function executeStreamingAICall({
  model,
  systemMessage,
  messages,
  tools = [],
  onToken,
  responseFormat,
}: AIExecutionConfig & { onToken: (token: string) => void }): Promise<AIExecutionResult> {
  const messagesWithSystem = ensureSystemMessage(messages, systemMessage);
  const toolDefinitions = tools.map((tool) => tool.defineOpenAITool());

  // If responseFormat is present use default AI Call
  if (responseFormat) {
    console.warn(
      "Strukturierte Antworten sind nicht mit Streaming kompatibel. Verwende executeDefaultAICall.",
    );
    return await executeDefaultAICall({
      model,
      systemMessage,
      messages,
      tools,
      responseFormat,
    });
  }

  const stream = await ai.chat.completions.create({
    model,
    messages: messagesWithSystem,
    tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
    stream: true,
    tool_choice: toolDefinitions.length > 0 ? "auto" : undefined,
  });

  let fullContent = "";
  const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;

    if (delta?.content) {
      fullContent += delta.content;
      onToken(delta.content);
    }

    processStreamingToolCalls(delta, toolCalls);
  }

  return processAIResponse(fullContent, toolCalls);
}

async function executeDefaultAICall({
  model,
  systemMessage,
  messages,
  tools = [],
  responseFormat,
}: Omit<AIExecutionConfig, "onToken">): Promise<AIExecutionResult> {
  const messagesWithSystem = ensureSystemMessage(messages, systemMessage);
  const toolDefinitions = tools.map((tool) => tool.defineOpenAITool());

  // Basisparameter für die Anfrage
  const requestParams: OpenAI.ChatCompletionCreateParams = {
    model,
    messages: messagesWithSystem,
    tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
    stream: false,
    tool_choice: toolDefinitions.length > 0 ? "auto" : undefined,
  };

  // Wenn ein responseFormat definiert ist, füge es der Anfrage hinzu
  if (responseFormat) {
    requestParams.response_format = zodResponseFormat(
      responseFormat.schema,
      responseFormat.name,
    );
  }

  const completion = await ai.chat.completions.create(requestParams);

  const responseMessage = completion.choices[0].message;
  const toolCalls = responseMessage.tool_calls || null;
  const content = responseMessage.content || "";
  const userObjectives = extractUserObjectives(content);

  // Wenn responseFormat definiert ist, versuche die strukturierten Daten zu parsen
  let structuredData = undefined;
  if (responseFormat && content) {
    try {
      structuredData = JSON.parse(content);
      // Validiere mit dem Zod Schema
      structuredData = responseFormat.schema.parse(structuredData);
    } catch (error) {
      console.error("Fehler beim Parsen der strukturierten Daten:", error);
      // Du kannst entscheiden, ob du einen Fehler werfen oder nur loggen möchtest
    }
  }

  return {
    message: content,
    toolCalls,
    userObjectives,
    structuredData,
  };
}

function ensureSystemMessage(
  messages: OpenAI.ChatCompletionMessageParam[],
  systemMessage: string,
): OpenAI.ChatCompletionMessageParam[] {
  const messagesCopy = [...messages];

  if (!messagesCopy.some((msg) => msg.role === ChatRole.System)) {
    messagesCopy.unshift({
      role: ChatRole.System,
      content: systemMessage,
    });
  }

  return messagesCopy;
}

export function extractUserObjectives(content: string): string[] {
  const objectives: string[] = [];
  const regex = /USER_OBJECTIVE:\s*(.+)$/gm;
  let match;

  while ((match = regex.exec(content)) !== null) {
    objectives.push(match[1].trim());
  }

  return objectives;
}

export function processAIResponse(
  content: string,
  toolCalls: OpenAI.ChatCompletionMessageToolCall[] | null,
  structuredData?: unknown,
): AIExecutionResult {
  const userObjectives = extractUserObjectives(content);
  const { created, updated, deleted } = extractEntityChanges(content);

  return {
    message: content,
    toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : null,
    userObjectives,
    structuredData,
    created: created || [],
    updated: updated || [],
    deleted: deleted || [],
  };
}

function extractEntityChanges(
  content: string,
): { created: unknown[]; updated: unknown[]; deleted: unknown[] } {
  const result: { created: unknown[]; updated: unknown[]; deleted: unknown[] } = {
    created: [],
    updated: [],
    deleted: [],
  };

  try {
    // Try to extract JSON blocks for created, updated, deleted entities
    const createdMatch = content.match(/CREATED:([\s\S]*?)(?=UPDATED:|DELETED:|$)/i);
    const updatedMatch = content.match(/UPDATED:([\s\S]*?)(?=CREATED:|DELETED:|$)/i);
    const deletedMatch = content.match(/DELETED:([\s\S]*?)(?=CREATED:|UPDATED:|$)/i);

    if (createdMatch && createdMatch[1]) {
      try {
        const jsonStr = createdMatch[1].trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          result.created = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        console.debug("Failed to parse CREATED entities:", e);
      }
    }

    if (updatedMatch && updatedMatch[1]) {
      try {
        const jsonStr = updatedMatch[1].trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          result.updated = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        console.debug("Failed to parse UPDATED entities:", e);
      }
    }

    if (deletedMatch && deletedMatch[1]) {
      try {
        const jsonStr = deletedMatch[1].trim();
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);
          result.deleted = Array.isArray(parsed) ? parsed : [parsed];
        }
      } catch (e) {
        console.debug("Failed to parse DELETED entities:", e);
      }
    }
  } catch (error) {
    console.debug("Error extracting entity changes:", error);
  }

  return result;
}

/**
 * Ai Tool Calls
 */
export interface ToolCallParams {
  toolCall: OpenAI.ChatCompletionMessageToolCall;
  tools: AssistantTool[];
  messages: OpenAI.ChatCompletionMessageParam[];
}

export async function handleToolCall(
  { toolCall, tools, messages: _messages }: ToolCallParams,
): Promise<OpenAI.ChatCompletionMessageParam> {
  try {
    const tool = getTool(toolCall.function.name, tools);
    const args = parseToolArguments(toolCall.function.arguments);
    const validatedArgs = tool.validateArgs(args);
    const result = await tool.execute(validatedArgs);

    return {
      tool_call_id: toolCall.id,
      role: ChatRole.Tool,
      content: typeof result === "string" ? result : JSON.stringify(result),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      tool_call_id: toolCall.id,
      role: ChatRole.Tool,
      content: JSON.stringify({ error: errorMessage }),
    };
  }
}

function getTool(toolName: string, tools: AssistantTool[]): AssistantTool {
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    throwAppError({
      message: `Tool not found: ${toolName}`,
      code: AppErrorCode.NOT_FOUND,
      context: { toolName },
    });
  }

  return tool!;
}

function parseToolArguments(argumentsJson: string): unknown {
  try {
    return JSON.parse(argumentsJson);
  } catch (_error) {
    throwAppError({
      message: "Invalid tool arguments format",
      code: AppErrorCode.VALIDATION_ERROR,
      context: { arguments: argumentsJson },
    });
  }
}

function processStreamingToolCalls(
  delta: unknown,
  toolCalls: OpenAI.ChatCompletionMessageToolCall[],
): void {
  if (!delta || typeof delta !== "object" || !("tool_calls" in delta) || !delta.tool_calls) return;

  (delta.tool_calls as unknown[]).forEach((toolCall: unknown, index: number) => {
    if (!toolCalls[index] && toolCall && typeof toolCall === "object") {
      const tc = toolCall as Record<string, unknown>;
      const id = tc.id as string;
      const _type = tc.type as string;
      const func = tc.function as Record<string, unknown> | undefined;

      toolCalls[index] = {
        id: id || "",
        type: "function",
        function: {
          name: func && typeof func === "object" && "name" in func ? String(func.name || "") : "",
          arguments: "",
        },
      };
    }

    if (toolCall && typeof toolCall === "object") {
      const tc = toolCall as Record<string, unknown>;
      const func = tc.function as Record<string, unknown> | undefined;

      if (
        func && typeof func === "object" && "arguments" in func &&
        typeof func.arguments === "string"
      ) {
        toolCalls[index].function.arguments += func.arguments;
      }
    }
  });
}

/**
 * Recursive handler
 */
export async function processToolCalls(
  config: AIExecutionConfig,
  tools: AssistantTool[],
  thread: Thread,
): Promise<AssistantResponse> {
  try {
    let aiResult = await executeAICall(config);
    let messages = [...config.messages]; // Copy original message

    // Sammle Änderungen an Entitäten
    const created: unknown[] = [];
    const updated: unknown[] = [];
    const deleted: unknown[] = [];

    messages.push({
      role: ChatRole.Assistant,
      content: aiResult.message,
      tool_calls: aiResult.toolCalls || undefined,
    });

    while (aiResult.toolCalls && aiResult.toolCalls.length > 0) {
      try {
        const toolCallResults = await Promise.all(
          aiResult.toolCalls.map((toolCall) =>
            processToolCallWithEntities(toolCall, tools, messages)
          ),
        );

        const toolResponses = toolCallResults.map((result) => result.response);

        for (const result of toolCallResults) {
          created.push(...result.created);
          updated.push(...result.updated);
          deleted.push(...result.deleted);
        }

        messages = [...messages, ...toolResponses];
        aiResult = await executeAICall({
          ...config,
          messages,
        });

        messages.push({
          role: ChatRole.Assistant,
          content: aiResult.message,
          tool_calls: aiResult.toolCalls || undefined,
        });
      } catch (error) {
        throw handleAppError(error, {
          message: "Error processing tool calls batch",
          code: AppErrorCode.INTERNAL_ERROR,
          context: {
            toolCallsCount: aiResult?.toolCalls?.length,
            modelName: config.model,
          },
        });
      }
    }

    if (thread && aiResult.userObjectives.length > 0) {
      try {
        await updateThread(thread.id, { userObjectives: aiResult.userObjectives });
      } catch (error) {
        // Error is no blocker
        console.error("Fehler beim Aktualisieren der Benutzerziele:", error);
      }
    }

    return {
      message: aiResult.message,
      threadId: thread?.id || "",
      created,
      updated,
      deleted,
    };
  } catch (error) {
    throw handleAppError(error, {
      message: "Error in tool calls processing",
      code: AppErrorCode.INTERNAL_ERROR,
      context: { threadId: thread?.id },
    });
  }
}

function extractEntitiesFromToolResponse(
  response: OpenAI.ChatCompletionMessageParam,
): { created: unknown[]; updated: unknown[]; deleted: unknown[] } {
  const result = {
    created: [],
    updated: [],
    deleted: [],
  };

  try {
    const content = typeof response.content === "string"
      ? JSON.parse(response.content)
      : response.content;

    if (content && !content.error) {
      if (content.created) {
        result.created = Array.isArray(content.created) ? content.created : [content.created];
      }

      if (content.updated) {
        result.updated = Array.isArray(content.updated) ? content.updated : [content.updated];
      }

      if (content.deleted) {
        result.deleted = Array.isArray(content.deleted) ? content.deleted : [content.deleted];
      }
    }
  } catch (error) {
    // Error is no blocker
    console.debug("Konnte Entitäten nicht aus Tool-Antwort extrahieren:", error);
  }

  return result;
}

async function processToolCallWithEntities(
  toolCall: OpenAI.ChatCompletionMessageToolCall,
  tools: AssistantTool[],
  messages: OpenAI.ChatCompletionMessageParam[],
): Promise<{
  response: OpenAI.ChatCompletionMessageParam;
  created: unknown[];
  updated: unknown[];
  deleted: unknown[];
}> {
  try {
    const response = await handleToolCall({
      toolCall,
      tools,
      messages,
    });

    const { created, updated, deleted } = extractEntitiesFromToolResponse(response);

    return {
      response,
      created,
      updated,
      deleted,
    };
  } catch (error) {
    throw handleAppError(error, {
      message: "Error processing tool call",
      code: AppErrorCode.INTERNAL_ERROR,
      context: { toolCallId: toolCall.id, toolName: toolCall.function.name },
    });
  }
}
