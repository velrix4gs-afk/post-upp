-- Only drop and recreate policies that need fixing for stories
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view all active stories" ON public.stories;
  DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
  
  -- Create new policies
  CREATE POLICY "Users can view all active stories"
  ON public.stories
  FOR SELECT
  TO authenticated
  USING (expires_at > now());

  CREATE POLICY "Users can update their own stories"
  ON public.stories
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

  -- Story views policies
  DROP POLICY IF EXISTS "Users can record their own story views" ON public.story_views;
  DROP POLICY IF EXISTS "Story owners can see who viewed their stories" ON public.story_views;

  CREATE POLICY "Users can record their own story views"
  ON public.story_views
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

  CREATE POLICY "Story owners can see who viewed their stories"
  ON public.story_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_views.story_id
      AND stories.user_id = auth.uid()
    )
  );
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_story_views_story_id ON public.story_views(story_id);