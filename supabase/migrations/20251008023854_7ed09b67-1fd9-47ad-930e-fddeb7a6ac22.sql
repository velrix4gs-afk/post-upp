-- Drop and recreate trending view with proper structure
DROP VIEW IF EXISTS public.trending_posts;

-- Add shares tracking
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares_count integer DEFAULT 0;

-- Create post_shares table to track shares
CREATE TABLE IF NOT EXISTS public.post_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_shares
CREATE POLICY "Users can view post shares"
  ON public.post_shares FOR SELECT
  USING (true);

CREATE POLICY "Users can share posts"
  ON public.post_shares FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Function to update share counts
CREATE OR REPLACE FUNCTION update_post_shares()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET shares_count = shares_count - 1 
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for share counts
DROP TRIGGER IF EXISTS update_share_counts ON public.post_shares;
CREATE TRIGGER update_share_counts
  AFTER INSERT OR DELETE ON public.post_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_post_shares();

-- Recreate trending posts view with shares prioritized
CREATE VIEW public.trending_posts AS
SELECT 
  p.*,
  (
    (p.shares_count * 5) +
    (p.reactions_count * 2) + 
    (p.comments_count * 3) - 
    (EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600)::int
  ) as trending_score
FROM public.posts p
WHERE 
  p.is_published = true AND
  p.created_at > now() - interval '7 days' AND
  p.privacy = 'public'
ORDER BY trending_score DESC;