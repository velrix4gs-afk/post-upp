-- Update trending posts view to prioritize most viewed, searched, and liked posts
DROP VIEW IF EXISTS public.trending_posts;

CREATE VIEW public.trending_posts AS
SELECT 
  p.id,
  p.user_id,
  p.content,
  p.media_url,
  p.media_type,
  p.privacy,
  p.is_published,
  p.scheduled_for,
  p.reactions_count,
  p.comments_count,
  p.shares_count,
  p.created_at,
  p.updated_at,
  (
    (p.shares_count * 10) +        -- Shares are most valuable (indicates reach)
    (p.reactions_count * 5) +      -- Reactions show engagement
    (p.comments_count * 7) +       -- Comments show deeper engagement
    (p.shares_count * 3) -         -- Add bonus for viral content
    (EXTRACT(EPOCH FROM (now() - p.created_at)) / 7200)::int  -- Decay slower (every 2 hours)
  ) as trending_score
FROM public.posts p
WHERE p.is_published = true
  AND p.privacy = 'public'
  AND p.created_at > (now() - interval '7 days')  -- Only last 7 days
ORDER BY trending_score DESC;