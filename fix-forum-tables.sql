-- Check if tables exist and drop them if they do
DROP TABLE IF EXISTS public.discussion_comments;
DROP TABLE IF EXISTS public.discussion_posts;

-- Create discussion_posts table
CREATE TABLE public.discussion_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS discussion_posts_user_id_idx ON public.discussion_posts(user_id);

-- Create discussion_comments table
CREATE TABLE public.discussion_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS discussion_comments_post_id_idx ON public.discussion_comments(post_id);
CREATE INDEX IF NOT EXISTS discussion_comments_user_id_idx ON public.discussion_comments(user_id);

-- Add foreign key constraint
ALTER TABLE public.discussion_comments 
ADD CONSTRAINT fk_discussion_comments_post_id 
FOREIGN KEY (post_id) 
REFERENCES public.discussion_posts(id) 
ON DELETE CASCADE;

-- Create RLS policies for discussion_posts
ALTER TABLE public.discussion_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can read posts
CREATE POLICY "Anyone can read posts" 
ON public.discussion_posts 
FOR SELECT 
USING (true);

-- Only authenticated users can insert posts
CREATE POLICY "Authenticated users can insert posts" 
ON public.discussion_posts 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Only post owners can update their posts
CREATE POLICY "Users can update their own posts" 
ON public.discussion_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Only post owners can delete their posts
CREATE POLICY "Users can delete their own posts" 
ON public.discussion_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for discussion_comments
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can read comments
CREATE POLICY "Anyone can read comments" 
ON public.discussion_comments 
FOR SELECT 
USING (true);

-- Only authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments" 
ON public.discussion_comments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Only comment owners can update their comments
CREATE POLICY "Users can update their own comments" 
ON public.discussion_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Only comment owners can delete their comments
CREATE POLICY "Users can delete their own comments" 
ON public.discussion_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Insert a sample post (replace with your user ID)
-- INSERT INTO public.discussion_posts (user_id, title, content)
-- VALUES ('your-user-id-here', 'Welcome to the Community Forum', 'This is a sample post to get the discussion started. Feel free to share your thoughts and experiences!');

-- To insert a sample comment, first get the post ID from the above insert
-- INSERT INTO public.discussion_comments (post_id, user_id, content)
-- VALUES (1, 'your-user-id-here', 'This is a sample comment. Looking forward to engaging with everyone!');
