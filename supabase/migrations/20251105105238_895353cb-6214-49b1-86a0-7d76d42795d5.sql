-- Create reposts table for tracking post reposts
CREATE TABLE IF NOT EXISTS public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reposts
CREATE POLICY "Users can create reposts"
  ON public.reposts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their reposts"
  ON public.reposts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view reposts"
  ON public.reposts
  FOR SELECT
  USING (true);

-- Add reposts_count to posts if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'posts' AND column_name = 'reposts_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN reposts_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create function to update repost count
CREATE OR REPLACE FUNCTION public.update_post_reposts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET reposts_count = reposts_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET reposts_count = GREATEST(0, reposts_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for repost count
DROP TRIGGER IF EXISTS update_reposts_count_trigger ON public.reposts;
CREATE TRIGGER update_reposts_count_trigger
  AFTER INSERT OR DELETE ON public.reposts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_reposts_count();

-- Add indices for performance
CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON public.reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON public.reposts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);