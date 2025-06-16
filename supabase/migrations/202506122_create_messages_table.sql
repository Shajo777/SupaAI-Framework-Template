-- Create assistant_message_embeddings table for storing vector embeddings and message content
CREATE TABLE assistant_message_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES assistant_threads(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL, -- Zeigt an welcher Teil einer Nachricht (index) es ist
  order_index INTEGER NOT NULL, -- Zeigt an welche Nachricht es ist
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for assistant_message_embeddings
CREATE INDEX idx_assistant_message_embeddings_thread ON assistant_message_embeddings (thread_id);
CREATE INDEX idx_assistant_message_embeddings_role ON assistant_message_embeddings (role);
CREATE INDEX idx_assistant_message_embeddings_chunk ON assistant_message_embeddings (thread_id, chunk_index);
CREATE INDEX idx_assistant_message_embeddings_order ON assistant_message_embeddings (thread_id, order_index);

-- Erstellen eines HNSW-Index für schnellere Ähnlichkeitsabfragen
CREATE INDEX IF NOT EXISTS idx_message_embedding
    ON assistant_message_embeddings
        USING hnsw (embedding vector_cosine_ops);

-- Erstellen der Funktion für Ähnlichkeitssuche
CREATE OR REPLACE FUNCTION match_embeddings(
    query_embedding vector,
    similarity_threshold float,
    match_count int,
    filter_thread_id uuid
)
    RETURNS TABLE (
      id uuid,
      thread_id uuid,
      chunk_index int,
      order_index int,
      role text,
      content text,
      embedding vector,
      created_at timestamp with time zone,
      similarity float
                  )
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        SELECT
            me.id,
            me.thread_id,
            me.chunk_index,
            me.order_index,
            me.role,
            me.content,
            me.embedding,
            me.created_at,
            1 - (me.embedding <=> query_embedding) as similarity
        FROM
            assistant_message_embeddings me
        WHERE
            1 - (me.embedding <=> query_embedding) > similarity_threshold
          AND me.thread_id = filter_thread_id
        ORDER BY
            me.embedding <=> query_embedding
        LIMIT match_count;
END;
$$;


-- Stellt sicher, dass die Kombination aus thread_id, order_index und chunk_index eindeutig ist
ALTER TABLE assistant_message_embeddings ADD CONSTRAINT unique_thread_message_chunk UNIQUE (thread_id, order_index, chunk_index);

-- Enable Row Level Security
ALTER TABLE assistant_message_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assistant_message_embeddings
CREATE POLICY "Users can view embeddings in their threads"
    ON assistant_message_embeddings FOR SELECT
    USING (
    EXISTS (
        SELECT 1 FROM assistant_threads
        WHERE assistant_threads.id = assistant_message_embeddings.thread_id
          AND assistant_threads.user_id = auth.uid()
    )
    );

CREATE POLICY "Users can manage embeddings in their threads"
    ON assistant_message_embeddings FOR ALL
    USING (
    EXISTS (
        SELECT 1 FROM assistant_threads
        WHERE assistant_threads.id = assistant_message_embeddings.thread_id
          AND assistant_threads.user_id = auth.uid()
    )
    );
