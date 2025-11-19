
-- Fix search_path for get_recommended_reels function
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
SET search_path = public
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
