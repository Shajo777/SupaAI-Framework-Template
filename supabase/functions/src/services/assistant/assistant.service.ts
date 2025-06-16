import { z } from "zod";
import {
  generateEmbeddingChunks,
  generateEmbeddings,
  OpenAIModel,
} from "@src/integrations/ai/ai.integration.ts";
import { AssistantTool } from "@src/services/assistant/tool.utils.ts";
import { AppErrorCode, handleAppError, throwAppError } from "@src/utils/error/error.utils.ts";
import {
  createMessage,
  createThread,
  findSimilarMessages,
  getNextOrderIndex,
  readThread,
  Thread,
  updateThread,
} from "@src/services/assistant/db.utils.ts";
import {
  AIExecutionConfig,
  executeAICall,
  processToolCalls,
} from "@src/services/assistant/ai.utils.ts";
import { ChatRole } from "@src/integrations/ai/ai.integration.ts";
import OpenAI from "openai";

/*
 * Types
 */

export interface AssistantSource {
  url: string;
  fileName: string;
}

export interface AssistantRequest<T = Record<string, unknown>> {
  message: string;
  meta: {
    userId: string;
    threadId?: string;
  };
  context?: T;
  sources?: AssistantSource[];
}

export interface AssistantResponse {
  message: string;
  threadId: string;
  created?: unknown[];
  updated?: unknown[];
  deleted?: unknown[];
}

export interface AssistantConfig<T extends z.ZodType = z.ZodType> {
  title: string;
  model: OpenAIModel;
  systemMessage: string;
  tools?: AssistantTool[];
  contextSchema: T;
  onToken?: (token: string) => void;
  similarity: number;
  matchCount: number;
}

/*
 * Schemas
 */

export const assistantSourceSchema = z.object({
  id: z.string(),
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
});

export const assistantRequestSchema = (context: z.ZodType) =>
  z.object({
    message: z.string().min(1, "Nachricht darf nicht leer sein"),
    meta: z.object({
      userId: z.string().min(1, "User ID ist erforderlich"),
      threadId: z.string().optional(),
    }),
    context,
    sources: z.array(assistantSourceSchema).optional(),
  });

/*
 * Class
 */

export class Assistant<T extends z.ZodType = z.ZodType> {
  private config: AssistantConfig<T>;

  constructor(config: AssistantConfig<T>) {
    this.config = config;
  }

  async thread<C = Record<string, unknown>>(
    request: AssistantRequest<C>,
  ): Promise<AssistantResponse> {
    try {
      const validatedRequest = this.validateRequest(request);
      const thread = await this.getThread(validatedRequest);
      const processConfig = await this.prepareProcess(validatedRequest, thread);
      const response = await this.processRequest(processConfig, thread);
      await this.postProcess(validatedRequest, thread, response);
      return response;
    } catch (error) {
      throw handleAppError(error, {
        message: "Assistant Thread Error",
        code: AppErrorCode.INTERNAL_ERROR,
        context: {
          assistantTitle: this.config.title,
          userId: request.meta.userId,
          threadId: request.meta.threadId,
        },
      });
    }
  }

  private validateRequest<C>(request: AssistantRequest<C>): AssistantRequest<C> {
    try {
      const schema = assistantRequestSchema(this.config.contextSchema);
      const validation = schema.safeParse(request);

      if (!validation.success) {
        throwAppError({
          message: "Invalid Assistant Request",
          code: AppErrorCode.VALIDATION_ERROR,
          context: { validation: validation.error },
        });
      }

      return request;
    } catch (error) {
      throw handleAppError(error, {
        message: "Request Validation Error",
        code: AppErrorCode.VALIDATION_ERROR,
      });
    }
  }

  private async getThread<C>(request: AssistantRequest<C>): Promise<Thread> {
    try {
      // If threadId is provided, try to get the existing thread
      if (request.meta.threadId) {
        const existingThread = await readThread(request.meta.threadId);

        if (existingThread) {
          return existingThread;
        }
      }

      return await createThread(
        request.meta.userId,
        this.config.title,
      );
    } catch (error) {
      throw handleAppError(error, {
        message: "Thread Retrieval Error",
        code: AppErrorCode.DATABASE_ERROR,
      });
    }
  }

  private async prepareProcess<C>(
    request: AssistantRequest<C>,
    thread: Thread,
  ): Promise<AIExecutionConfig> {
    try {
      let systemContent = this.config.systemMessage;

      if (thread.userObjectives && thread.userObjectives.length > 0) {
        systemContent += "\n\nUser Objectives:\n" +
          thread.userObjectives.map((obj) => `- ${obj}`).join("\n");
      }

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: ChatRole.System, content: systemContent },
      ];

      if (thread && request.message) {
        const similarMessages = await findSimilarMessages(
          thread.id,
          request.message,
          this.config.similarity,
          this.config.matchCount,
        );

        const sortedMessages = similarMessages.sort((a, b) => a.orderIndex - b.orderIndex);

        for (const msg of sortedMessages) {
          messages.push({
            role: msg.role as ChatRole,
            content: msg.content,
          } as OpenAI.ChatCompletionMessageParam);
        }
      }

      messages.push({
        role: ChatRole.User,
        content: request.message,
      });

      return {
        model: this.config.model,
        systemMessage: this.config.systemMessage,
        messages,
        tools: this.config.tools,
        onToken: this.config.onToken,
      };
    } catch (error) {
      throw handleAppError(error, {
        message: "Process Preparation Error",
        code: AppErrorCode.INTERNAL_ERROR,
      });
    }
  }

  private async processRequest(
    config: AIExecutionConfig,
    thread: Thread,
  ): Promise<AssistantResponse> {
    try {
      if (this.config.tools && this.config.tools.length > 0) {
        return await processToolCalls(config, this.config.tools, thread);
      }

      const aiResult = await executeAICall(config);

      // Run embedding generation, thread update (if needed), and get next order index in parallel
      const embeddingPromise = generateEmbeddings(aiResult.message);
      const threadUpdatePromise = aiResult.userObjectives.length > 0
        ? updateThread(thread.id, { userObjectives: aiResult.userObjectives })
        : Promise.resolve();
      const orderIndexPromise = getNextOrderIndex(thread.id);

      // Wait for embedding generation and order index to complete
      const [embedding, orderIndex] = await Promise.all([embeddingPromise, orderIndexPromise]);

      // Create message
      await createMessage(
        thread.id,
        orderIndex, // orderIndex - which message it is
        0, // chunkIndex - first chunk of the message
        ChatRole.Assistant,
        aiResult.message,
        embedding,
      );

      // Ensure thread update is complete
      await threadUpdatePromise;

      return {
        message: aiResult.message,
        threadId: thread.id,
        created: aiResult.created || [],
        updated: aiResult.updated || [],
        deleted: aiResult.deleted || [],
      };
    } catch (error) {
      throw handleAppError(error, {
        message: "Request Processing Error",
        code: AppErrorCode.INTERNAL_ERROR,
      });
    }
  }

  async postProcess<C>(
    request: AssistantRequest<C>,
    thread: Thread,
    response: AssistantResponse,
  ): Promise<void> {
    try {
      const orderIndex = await getNextOrderIndex(thread.id);
      await Promise.all([
        this.updateMessages(request.message, thread.id, ChatRole.User, orderIndex),
        this.updateMessages(response.message, thread.id, ChatRole.Assistant, orderIndex + 1),
      ]);
    } catch (error) {
      throw handleAppError(error, {
        message: "Post Processing Error",
        code: AppErrorCode.INTERNAL_ERROR,
        context: {
          threadId: thread.id,
        },
      });
    }
  }

  async updateMessages(text: string, threadId: string, role: ChatRole, orderIndex: number): Promise<void> {
    try {
      const embeddingChunks = await generateEmbeddingChunks(text);
      const createMessagePromises = embeddingChunks.map((embedding, i) =>
        createMessage(
          threadId,
          orderIndex, // orderIndex - which message it is
          i, // chunkIndex - which part of the message it is
          role,
          embedding.content,
          embedding.embedding,
        )
      );

      await Promise.all(createMessagePromises);
    } catch (error) {
      throw handleAppError(error, {
        message: "Update Messages Error",
        code: AppErrorCode.INTERNAL_ERROR,
        context: {
          threadId,
          role,
        },
      });
    }
  }
}
