export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      assistant_message_embeddings: {
        Row: {
          chunk_index: number;
          content: string;
          created_at: string | null;
          embedding: string | null;
          id: string;
          order_index: number;
          role: string;
          thread_id: string | null;
        };
        Insert: {
          chunk_index: number;
          content: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          order_index: number;
          role: string;
          thread_id?: string | null;
        };
        Update: {
          chunk_index?: number;
          content?: string;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          order_index?: number;
          role?: string;
          thread_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assistant_message_embeddings_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "assistant_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      assistant_threads: {
        Row: {
          created_at: string | null;
          id: string;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
          user_objectives: Json | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          user_objectives?: Json | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          user_objectives?: Json | null;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          bad_tags: Json | null;
          block_goal: string;
          created_at: string;
          exercises_count: number | null;
          exercises_positive: number | null;
          good_tags: Json | null;
          id: string;
          lesson_id: string | null;
          order_index: number | null;
          score: number | null;
          updated_at: string;
        };
        Insert: {
          bad_tags?: Json | null;
          block_goal: string;
          created_at?: string;
          exercises_count?: number | null;
          exercises_positive?: number | null;
          good_tags?: Json | null;
          id?: string;
          lesson_id?: string | null;
          order_index?: number | null;
          score?: number | null;
          updated_at?: string;
        };
        Update: {
          bad_tags?: Json | null;
          block_goal?: string;
          created_at?: string;
          exercises_count?: number | null;
          exercises_positive?: number | null;
          good_tags?: Json | null;
          id?: string;
          lesson_id?: string | null;
          order_index?: number | null;
          score?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blocks_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          answer: string | null;
          block_id: string | null;
          created_at: string | null;
          expected: string;
          id: string;
          question: string;
          type: Database["public"]["Enums"]["exercise_t"];
        };
        Insert: {
          answer?: string | null;
          block_id?: string | null;
          created_at?: string | null;
          expected: string;
          id?: string;
          question: string;
          type?: Database["public"]["Enums"]["exercise_t"];
        };
        Update: {
          answer?: string | null;
          block_id?: string | null;
          created_at?: string | null;
          expected?: string;
          id?: string;
          question?: string;
          type?: Database["public"]["Enums"]["exercise_t"];
        };
        Relationships: [
          {
            foreignKeyName: "exercises_block_id_fkey";
            columns: ["block_id"];
            isOneToOne: false;
            referencedRelation: "blocks";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_evaluations: {
        Row: {
          bad_tags: Json | null;
          duration_sec: number | null;
          eval_count: number | null;
          good_tags: Json | null;
          lesson_id: string;
          progress: number | null;
          score: number | null;
          success_ratio: number | null;
        };
        Insert: {
          bad_tags?: Json | null;
          duration_sec?: number | null;
          eval_count?: number | null;
          good_tags?: Json | null;
          lesson_id: string;
          progress?: number | null;
          score?: number | null;
          success_ratio?: number | null;
        };
        Update: {
          bad_tags?: Json | null;
          duration_sec?: number | null;
          eval_count?: number | null;
          good_tags?: Json | null;
          lesson_id?: string;
          progress?: number | null;
          score?: number | null;
          success_ratio?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_evaluations_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: true;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          chapter: string | null;
          id: string;
          lesson_goal: string;
          order_index: number | null;
          title: string;
          training_id: string | null;
        };
        Insert: {
          chapter?: string | null;
          id?: string;
          lesson_goal: string;
          order_index?: number | null;
          title: string;
          training_id?: string | null;
        };
        Update: {
          chapter?: string | null;
          id?: string;
          lesson_goal?: string;
          order_index?: number | null;
          title?: string;
          training_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          file_name: string;
          id: string;
          training_id: string | null;
          uploaded_at: string;
          url: string | null;
        };
        Insert: {
          file_name: string;
          id?: string;
          training_id?: string | null;
          uploaded_at?: string;
          url?: string | null;
        };
        Update: {
          file_name?: string;
          id?: string;
          training_id?: string | null;
          uploaded_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sources_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
      training_evaluations: {
        Row: {
          bad_tags: Json | null;
          duration_sec: number | null;
          eval_count: number | null;
          good_tags: Json | null;
          progress: number | null;
          score: number | null;
          success_ratio: number | null;
          training_id: string;
        };
        Insert: {
          bad_tags?: Json | null;
          duration_sec?: number | null;
          eval_count?: number | null;
          good_tags?: Json | null;
          progress?: number | null;
          score?: number | null;
          success_ratio?: number | null;
          training_id: string;
        };
        Update: {
          bad_tags?: Json | null;
          duration_sec?: number | null;
          eval_count?: number | null;
          good_tags?: Json | null;
          progress?: number | null;
          score?: number | null;
          success_ratio?: number | null;
          training_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_evaluations_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: true;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
        ];
      };
      trainings: {
        Row: {
          created_at: string;
          description: string;
          id: string;
          main_goal: string;
          status: Database["public"]["Enums"]["training_status"];
          title: string;
          user_id: string | null;
          visibility: Database["public"]["Enums"]["visibility_type"];
        };
        Insert: {
          created_at?: string;
          description: string;
          id?: string;
          main_goal: string;
          status?: Database["public"]["Enums"]["training_status"];
          title: string;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["visibility_type"];
        };
        Update: {
          created_at?: string;
          description?: string;
          id?: string;
          main_goal?: string;
          status?: Database["public"]["Enums"]["training_status"];
          title?: string;
          user_id?: string | null;
          visibility?: Database["public"]["Enums"]["visibility_type"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown };
        Returns: unknown;
      };
      halfvec_avg: {
        Args: { "": number[] };
        Returns: unknown;
      };
      halfvec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      halfvec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      halfvec_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      hnsw_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnsw_sparsevec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      hnswhandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflat_bit_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflat_halfvec_support: {
        Args: { "": unknown };
        Returns: unknown;
      };
      ivfflathandler: {
        Args: { "": unknown };
        Returns: unknown;
      };
      l2_norm: {
        Args: { "": unknown } | { "": unknown };
        Returns: number;
      };
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown };
        Returns: unknown;
      };
      match_embeddings: {
        Args: {
          query_embedding: string;
          similarity_threshold: number;
          match_count: number;
          filter_thread_id: string;
        };
        Returns: {
          id: string;
          thread_id: string;
          chunk_index: number;
          order_index: number;
          role: string;
          content: string;
          embedding: string;
          created_at: string;
          similarity: number;
        }[];
      };
      sparsevec_out: {
        Args: { "": unknown };
        Returns: unknown;
      };
      sparsevec_send: {
        Args: { "": unknown };
        Returns: string;
      };
      sparsevec_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
      vector_avg: {
        Args: { "": number[] };
        Returns: string;
      };
      vector_dims: {
        Args: { "": string } | { "": unknown };
        Returns: number;
      };
      vector_norm: {
        Args: { "": string };
        Returns: number;
      };
      vector_out: {
        Args: { "": string };
        Returns: unknown;
      };
      vector_send: {
        Args: { "": string };
        Returns: string;
      };
      vector_typmod_in: {
        Args: { "": unknown[] };
        Returns: number;
      };
    };
    Enums: {
      content_format: "text" | "video" | "audio" | "interactive";
      difficulty_level: "beginner" | "intermediate" | "advanced" | "expert";
      exercise_t: "free_text" | "multiple_choice" | "single_choice";
      lesson_type: "theory" | "practice" | "quiz" | "assignment";
      training_status: "draft" | "published";
      visibility_type: "public" | "private";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  } ? keyof (
      & Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
      & Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
    )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database } ? (
    & Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    & Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"]
  )[TableName] extends {
    Row: infer R;
  } ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (
    & DefaultSchema["Tables"]
    & DefaultSchema["Views"]
  ) ? (
      & DefaultSchema["Tables"]
      & DefaultSchema["Views"]
    )[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    } ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
  } ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    } ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
  } ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    } ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  } ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      content_format: ["text", "video", "audio", "interactive"],
      difficulty_level: ["beginner", "intermediate", "advanced", "expert"],
      exercise_t: ["free_text", "multiple_choice", "single_choice"],
      lesson_type: ["theory", "practice", "quiz", "assignment"],
      training_status: ["draft", "published"],
      visibility_type: ["public", "private"],
    },
  },
} as const;
