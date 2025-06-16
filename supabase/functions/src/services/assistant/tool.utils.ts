import { z } from "zod";
import { AppErrorCode, handleAppError, throwAppError } from "@src/utils/error/error.utils.ts";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolOptions } from "@src/integrations/ai/ai.integration.ts";
import OpenAI from "openai";

export enum OpenAIToolType {
  FUNCTION = "function",
}

export enum AssistantToolType {
  GET = "get",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}

export class AssistantTool<TSchema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  type: AssistantToolType;
  argsSchema: z.ZodType;
  private callFunction: <T>(args: z.infer<TSchema>) => Promise<T>;

  constructor(
    name: string,
    description: string,
    type: AssistantToolType,
    schema: z.ZodType,
    callFunction: <T>(args: z.infer<TSchema>) => Promise<T>,
  ) {
    this.name = name;
    this.description = description;
    this.type = type;
    this.argsSchema = schema;
    this.callFunction = callFunction;
  }

  async execute<T>(args: z.infer<TSchema>): Promise<T> {
    try {
      return await this.callFunction(args);
    } catch (error) {
      throw handleAppError(error, {
        message: "AssistantTool Call Error",
        code: AppErrorCode.INTERNAL_ERROR,
      });
    }
  }

  defineOpenAITool(options: Partial<ToolOptions> = {
    $refStrategy: "none",
    target: "openApi3",
    strict: true,
  }): OpenAI.ChatCompletionTool {
    return {
      type: OpenAIToolType.FUNCTION,
      function: {
        name: this.name,
        description: this.description,
        parameters: zodToJsonSchema(this.argsSchema, options) as Record<string, unknown>,
      },
    };
  }

  validateArgs(args: unknown): z.infer<TSchema> {
    const validation = this.argsSchema.safeParse(args);

    if (!validation.success) {
      throwAppError({
        message: "AssistantTool Validation Error",
        code: AppErrorCode.VALIDATION_ERROR,
        context: { validation },
      });
    }

    return validation.data;
  }
}
