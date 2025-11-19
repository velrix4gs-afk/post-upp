
-- Fix get_recommended_reels function to return proper structure
DROP FUNCTION IF EXISTS get_recommended_reels(uuid, integer, integer);

CREATE OR REPLACE FUNCTION get_recommended_reels(
  p_user_id uuid,
  p_page_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  video_url text,
  thumbnail_url text,
  caption text,
  duration integer,
  views_count integer,
  likes_count integer,
  comments_count integer,
  shares_count integer,
  created_at timestamptz,
  creator_name text,
  creator_avatar text,
  is_verified boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.user_id,
    r.video_url,
    r.thumbnail_url,
    r.caption,
    r.duration,
    r.views_count,
    r.likes_count,
    r.comments_count,
    r.shares_count,
    r.created_at,
    p.display_name as creator_name,
    p.avatar_url as creator_avatar,
    p.is_verified
  FROM reels r
  JOIN profiles p ON p.id = r.user_id
  ORDER BY r.created_at DESC
  LIMIT p_page_size
  OFFSET p_page_offset;
END;
$$;

-- Ensure creator_pages RLS policies are correct
ALTER TABLE creator_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view published creator pages" ON creator_pages;
CREATE POLICY "Users can view published creator pages"
  ON creator_pages FOR SELECT
  USING (is_published = true OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own pages" ON creator_pages;
CREATE POLICY "Users can create their own pages"
  ON creator_pages FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own pages" ON creator_pages;
CREATE POLICY "Users can update their own pages"
  ON creator_pages FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own pages" ON creator_pages;
CREATE POLICY "Users can delete their own pages"
  ON creator_pages FOR DELETE
  USING (user_id = auth.uid());

-- Ensure reels RLS policies are correct
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reels" ON reels;
CREATE POLICY "Anyone can view reels"
  ON reels FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own reels" ON reels;
CREATE POLICY "Users can create their own reels"
  ON reels FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reels" ON reels;
CREATE POLICY "Users can update their own reels"
  ON reels FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own reels" ON reels;
CREATE POLICY "Users can delete their own reels"
  ON reels FOR DELETE
  USING (user_id = auth.uid());
