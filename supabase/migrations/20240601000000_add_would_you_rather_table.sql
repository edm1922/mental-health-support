-- Create a table to store Would You Rather questions and responses
CREATE TABLE IF NOT EXISTS public.would_you_rather_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id TEXT NOT NULL,
  selected_option TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure selected_option is either 'optionA' or 'optionB'
  CONSTRAINT valid_option CHECK (selected_option IN ('optionA', 'optionB'))
);

-- Create indexes for faster queries
CREATE INDEX idx_would_you_rather_responses_question_id ON public.would_you_rather_responses(question_id);
CREATE INDEX idx_would_you_rather_responses_user_id ON public.would_you_rather_responses(user_id);

-- Add RLS policies
ALTER TABLE public.would_you_rather_responses ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for non-logged-in users)
CREATE POLICY "Allow anonymous inserts" ON public.would_you_rather_responses
  FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);

-- Allow authenticated users to insert their own responses
CREATE POLICY "Allow authenticated inserts" ON public.would_you_rather_responses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to view all responses (for showing statistics)
CREATE POLICY "Allow all to view responses" ON public.would_you_rather_responses
  FOR SELECT USING (true);
