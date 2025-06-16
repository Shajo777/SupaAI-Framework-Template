import { Database as GeneratedDatabase } from "@src/integrations/db/generated.types.ts";

export type Database = GeneratedDatabase & {
  public: {
    Functions: {
      match_embeddings: {
        Args: {
          query_embedding: string;
          similarity_threshold: number;
          match_count: number;
          filter_thread_id: string;
        };
        Returns: {
          id: string;
          thread_id: string | null;
          block_index: number;
          role: string;
          content: string;
          embedding: string | null;
          created_at: string | null;
          similarity: number;
        }[];
      };
    } & GeneratedDatabase["public"]["Functions"];
  };
};
