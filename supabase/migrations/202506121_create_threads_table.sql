-- Create assistant_threads table
CREATE TABLE assistant_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  user_objectives JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for assistant_threads
CREATE INDEX idx_assistant_threads_user ON assistant_threads (user_id);

-- Enable Row Level Security
ALTER TABLE assistant_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assistant_threads
CREATE POLICY "Users can view their own threads"
  ON assistant_threads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own threads"
  ON assistant_threads FOR ALL
  USING (user_id = auth.uid());
