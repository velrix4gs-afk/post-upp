-- Fix missing RLS policies on comments table

-- Allow users to view comments on visible posts
CREATE POLICY "Users can view comments on visible posts"
ON public.comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id
  )
);

-- Allow authenticated users to create comments on visible posts
CREATE POLICY "Users can create comments on visible posts"
ON public.comments FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = comments.post_id
  )
);