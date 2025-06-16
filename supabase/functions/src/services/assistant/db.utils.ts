import db from "@src/integrations/db/db.integration.ts";
import { AppErrorCode, handleAppError, throwAppError } from "@src/utils/error/error.utils.ts";
import { generateEmbeddings } from "@src/integrations/ai/ai.integration.ts";

export interface Thread {
  id: string;
  userId: string;
  title: string;
  userObjectives?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageEmbedding {
  id: string;
  threadId: string;
  chunkIndex: number;
  orderIndex: number;
  role: string;
  content: string;
  embedding?: string;
  createdAt: Date;
}

/*
 * Thread Modles
 */

export async function createThread(userId: string, title: string): Promise<Thread> {
  try {
    const { data: thread, error } = await db
      .from("assistant_threads")
      .insert({
        user_id: userId,
        title: title || null,
        user_objectives: "[]", // Initialize with empty array
      })
      .select()
      .single();

    // If Unauthorized User Request
    if (error?.code === "PGRST116") {
      throwAppError({
        message: "Get Thread Error",
        code: AppErrorCode.UNAUTHORIZED,
      }, error);
    }

    if (!thread) {
      throwAppError({
        message: "Create Thread Error",
        code: AppErrorCode.DATABASE_ERROR,
        context: {
          userId,
          title,
        },
      });
    }

    return {
      id: thread?.id!,
      userId: thread?.user_id!,
      title: thread?.title!,
      userObjectives: thread?.user_objectives ? JSON.parse(thread.user_objectives as string) : [],
      createdAt: new Date(thread?.created_at!),
      updatedAt: new Date(thread?.updated_at!),
    };
  } catch (error) {
    throw handleAppError(error, {
      message: "Create Thread Error",
      code: AppErrorCode.DATABASE_ERROR,
    });
  }
}

export async function readThread(threadId: string): Promise<Thread | null> {
  try {
    const { data: thread, error } = await db
      .from("assistant_threads")
      .select("*")
      .eq("id", threadId)
      .single();

    // If Unauthorized User Request
    if (error?.code === "PGRST116") {
      throwAppError({
        message: "Get Thread Error",
        code: AppErrorCode.UNAUTHORIZED,
      }, error);
    }

    if (!thread) return null;

    return {
      id: thread?.id!,
      userId: thread?.user_id!,
      title: thread?.title!,
      userObjectives: thread?.user_objectives ? JSON.parse(thread.user_objectives as string) : [],
      createdAt: new Date(thread?.created_at!),
      updatedAt: new Date(thread?.updated_at!),
    };
  } catch (error) {
    throw handleAppError(error, {
      message: "Get Thread Error",
      code: AppErrorCode.DATABASE_ERROR,
    });
  }
}

export async function updateThread(
  threadId: string,
  params: { title?: string; userObjectives?: string[] },
): Promise<Thread> {
  if ((!params.title && !params.userObjectives)) {
    throwAppError({
      message: "Update Thread Error",
      code: AppErrorCode.DATABASE_ERROR,
      context: {
        title: params.title,
        userObjectives: params.userObjectives,
      },
    });
  }

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.title !== undefined) {
      updateData.title = params.title;
    }

    if (params.userObjectives !== undefined) {
      updateData.user_objectives = params.userObjectives;
    }

    const { data: thread, error } = await db
      .from("assistant_threads")
      .update(updateData)
      .eq("id", threadId)
      .select()
      .single();

    if (error?.code === "PGRST116") {
      throwAppError({
        message: "Update Thread Error",
        code: AppErrorCode.UNAUTHORIZED,
      }, error);
    }

    return {
      id: thread?.id!,
      userId: thread?.user_id!,
      title: thread?.title!,
      userObjectives: thread?.user_objectives ? JSON.parse(thread.user_objectives as string) : [],
      createdAt: new Date(thread?.created_at!),
      updatedAt: new Date(thread?.updated_at!),
    };
  } catch (error) {
    throw handleAppError(error, {
      message: "Update Thread Error",
      code: AppErrorCode.DATABASE_ERROR,
    });
  }
}

export async function deleteThread(threadId: string): Promise<boolean> {
  try {
    const { error } = await db
      .from("assistant_threads")
      .delete()
      .eq("id", threadId);

    // If Unauthorized User Request
    if (error?.code === "PGRST116") {
      throwAppError({
        message: "Delete Thread Error",
        code: AppErrorCode.UNAUTHORIZED,
      }, error);
    }

    return true;
  } catch (error) {
    throw handleAppError(error, {
      message: "Delete Thread Error",
      code: AppErrorCode.DATABASE_ERROR,
      context: {
        threadId,
      },
    });
  }
}

/*
 * Message Embeddings Models
 */

export async function createMessage(
  threadId: string,
  orderIndex: number,
  chunkIndex: number,
  role: string,
  content: string,
  embedding: string,
): Promise<MessageEmbedding> {
  try {
    const { data: message, error } = await db
      .from("assistant_message_embeddings")
      .insert({
        thread_id: threadId,
        order_index: orderIndex,
        chunk_index: chunkIndex,
        role: role,
        content: content,
        embedding: embedding,
      })
      .select()
      .single();

    // If Unauthorized User Request
    if (error?.code === "PGRST116") {
      throwAppError({
        message: "Create Message Embedding Error",
        code: AppErrorCode.UNAUTHORIZED,
      }, error);
    }

    if (!message) {
      throwAppError({
        message: "Create Message Embedding Error",
        code: AppErrorCode.DATABASE_ERROR,
        context: {
          threadId,
          orderIndex,
          chunkIndex,
          role,
          content,
        },
      });
    }

    return {
      id: message?.id!,
      threadId: message?.thread_id!,
      orderIndex: message?.order_index!,
      chunkIndex: message?.chunk_index!,
      role: message?.role!,
      content: message?.content!,
      embedding: message?.embedding!,
      createdAt: new Date(message?.created_at!),
    };
  } catch (error) {
    throw handleAppError(error, {
      message: "Create Message Embedding Error",
      code: AppErrorCode.DATABASE_ERROR,
    });
  }
}

export async function getNextOrderIndex(threadId: string): Promise<number> {
  try {
    // Query the database to find the highest current order_index for the given thread
    const { data, error } = await db
      .from("assistant_message_embeddings")
      .select("order_index")
      .eq("thread_id", threadId)
      .order("order_index", { ascending: false })
      .limit(1);

    // If Unauthorized User Request
    if (error?.code === "PGRST116") {
      throwAppError({
        message: "Get Next Order Index Error",
        code: AppErrorCode.UNAUTHORIZED,
      }, error);
    }

    // If there's an error or no data, return 1 as the first order index
    if (error || !data || data.length === 0) {
      return 1;
    }

    // Return the next available order_index (highest + 1)
    return (data[0].order_index || 0) + 1;
  } catch (error) {
    throw handleAppError(error, {
      message: "Get Next Order Index Error",
      code: AppErrorCode.DATABASE_ERROR,
      context: {
        threadId,
      },
    });
  }
}

export async function findSimilarMessages(
  threadId: string,
  query: string,
  similarity: number,
  matchCount: number,
): Promise<MessageEmbedding[]> {
  try {
    const embedding = await generateEmbeddings(query);

    const { data, error } = await db.rpc("match_embeddings", {
      query_embedding: embedding,
      similarity_threshold: similarity,
      match_count: matchCount,
      filter_thread_id: threadId,
    });

    if (error) {
      throwAppError({
        message: `Message Embedding Error: ${query}`,
        code: AppErrorCode.NOT_FOUND,
        context: {
          threadId,
          query,
          similarity,
          matchCount,
        },
      });
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      id: item.id,
      threadId: item.thread_id || "",
      chunkIndex: item.chunk_index,
      orderIndex: item.order_index,
      role: item.role,
      content: item.content,
      embedding: item.embedding || undefined,
      createdAt: new Date(item.created_at || Date.now()),
    }));
  } catch (error) {
    throw handleAppError(error, {
      message: "Find Similar Messages Error",
      code: AppErrorCode.DATABASE_ERROR,
    });
  }
}
