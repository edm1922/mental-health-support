-- Create the ai_assistant_conversations table for storing user interactions with the Emotion AI Assistant
DO $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'ai_assistant_conversations'
  ) THEN
    -- Create the table
    CREATE TABLE public.ai_assistant_conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      response TEXT NOT NULL,
      emotion_detected TEXT,
      sentiment_score FLOAT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for faster queries
    CREATE INDEX idx_ai_assistant_conversations_user_id ON public.ai_assistant_conversations(user_id);

    -- Disable RLS initially for easier development
    ALTER TABLE public.ai_assistant_conversations DISABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'Created ai_assistant_conversations table';
  ELSE
    RAISE NOTICE 'ai_assistant_conversations table already exists';
  END IF;
END $$;
