import { getEnv } from "@src/utils/env/env.utils.ts";
import { Env } from "@src/utils/env/env.utils.ts";
import OpenAI from "openai";
import { Options, Targets } from "zod-to-json-schema";
import { AppErrorCode, handleAppError } from "@src/utils/error/error.utils.ts";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export enum OpenAIModel {
  // GPT-4o models
  GPT4O = "gpt-4o",
  GPT4O_2024_08_06 = "gpt-4o-2024-08-06",
  GPT4O_2024_05_13 = "gpt-4o-2024-05-13",
  GPT4O_MINI = "gpt-4o-mini",
  GPT4O_MINI_2024_07_18 = "gpt-4o-mini-2024-07-18",

  // GPT-4 Turbo models
  GPT4_TURBO = "gpt-4-turbo",
  GPT4_TURBO_2024_04_09 = "gpt-4-turbo-2024-04-09",
  GPT4_0125_PREVIEW = "gpt-4-0125-preview",
  GPT4_TURBO_PREVIEW = "gpt-4-turbo-preview",

  // GPT-4 models
  GPT4_1106_PREVIEW = "gpt-4-1106-preview",
  GPT4_VISION_PREVIEW = "gpt-4-vision-preview",
  GPT4 = "gpt-4",
  GPT4_0314 = "gpt-4-0314",
  GPT4_0613 = "gpt-4-0613",
  GPT4_32K = "gpt-4-32k",
  GPT4_32K_0314 = "gpt-4-32k-0314",
  GPT4_32K_0613 = "gpt-4-32k-0613",
}

export enum ChatRole {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
  Function = "function",
}

export interface ToolOptions extends Options<Targets> {
  strict?: boolean;
}

export interface EmbeddingOptions {
  modelName?: string;
  maxRetries?: number;
  timeout?: number;
}

export interface TextSplitOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const apiKey = getEnv(Env.openaiApiKey);

if (!apiKey) {
  throw new Error(
    "OpenAI API key is required. Make sure environment variable is set.",
  );
}

const openAi: OpenAI = new OpenAI({ apiKey });
export const ai = openAi;

const openAiEmbeddings = (
  options?: EmbeddingOptions,
): OpenAIEmbeddings =>
  new OpenAIEmbeddings({
    openAIApiKey: apiKey,
    modelName: options?.modelName || "text-embedding-3-small",
    maxRetries: options?.maxRetries || 3,
    timeout: options?.timeout || 30000,
  });

const textSplitter = (options?: TextSplitOptions) =>
  new RecursiveCharacterTextSplitter({
    chunkSize: options?.chunkSize || 1000,
    chunkOverlap: options?.chunkSize || 200,
  });

export interface EmbeddingChunk {
  content: string;
  embedding: string;
}

export async function generateEmbeddingChunks(
  text: string,
  options?: TextSplitOptions,
): Promise<EmbeddingChunk[]> {
  try {
    const snippets = await splitTextIntoChunks(text, options);

    // Process all snippets in parallel
    const embeddingPromises = snippets.map(async (snippet) => ({
      content: snippet,
      embedding: await generateEmbeddings(snippet),
    }));

    // Wait for all embeddings to be generated
    const embeddingChunks = await Promise.all(embeddingPromises);

    return embeddingChunks;
  } catch (error) {
    throw handleAppError(error, {
      message: "Generate Embedding Chunks Error",
      code: AppErrorCode.INTERNAL_ERROR,
      context: {
        textLength: text.length,
      },
    });
  }
}

export async function generateEmbeddings(text: string): Promise<string> {
  try {
    const embeddings = openAiEmbeddings();

    const result = await embeddings.embedQuery(text);
    return JSON.stringify(result);
  } catch (error) {
    throw handleAppError(error, {
      message: "Create Embeddings Error",
      code: AppErrorCode.INTERNAL_ERROR,
    });
  }
}

export async function splitTextIntoChunks(
  text: string,
  options?: TextSplitOptions,
): Promise<string[]> {
  try {
    return await textSplitter(options).splitText(text);
  } catch (error) {
    throw handleAppError(error, {
      message: "Split Embeddings Error",
      code: AppErrorCode.INTERNAL_ERROR,
    });
  }
}
