-- Phase 2: Post drafts, scheduling, and hashtags

-- Create post_drafts table for saving unpublished posts
CREATE TABLE IF NOT EXISTS public.post_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text,
  media_url text,
  media_type text,
  privacy text DEFAULT 'public',
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on post_drafts
ALTER TABLE public.post_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies for post_drafts
CREATE POLICY "Users can view their own drafts"
  ON public.post_drafts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own drafts"
  ON public.post_drafts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own drafts"
  ON public.post_drafts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own drafts"
  ON public.post_drafts FOR DELETE
  USING (user_id = auth.uid());

-- Add scheduled_for to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Create post_hashtags junction table
CREATE TABLE IF NOT EXISTS public.post_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id uuid REFERENCES public.hashtags(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, hashtag_id)
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;

-- RLS policies for hashtags
CREATE POLICY "Anyone can view hashtags"
  ON public.hashtags FOR SELECT
  USING (true);

CREATE POLICY "System can manage hashtags"
  ON public.hashtags FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS policies for post_hashtags
CREATE POLICY "Anyone can view post hashtags"
  ON public.post_hashtags FOR SELECT
  USING (true);

CREATE POLICY "Users can add hashtags to their posts"
  ON public.post_hashtags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_hashtags.post_id AND posts.user_id = auth.uid()
  ));

-- Function to extract and store hashtags
CREATE OR REPLACE FUNCTION extract_hashtags(post_content text)
RETURNS text[]
LANGUAGE plpgsql
AS $$
DECLARE
  hashtag_array text[];
BEGIN
  SELECT array_agg(DISTINCT lower(regexp_replace(match[1], '^#', '')))
  INTO hashtag_array
  FROM regexp_matches(post_content, '#(\w+)', 'g') AS match;
  
  RETURN COALESCE(hashtag_array, ARRAY[]::text[]);
END;
$$;

-- Create trending posts view (based on recent engagement)
CREATE OR REPLACE VIEW public.trending_posts AS
SELECT 
  p.*,
  (
    (p.reactions_count * 2) + 
    (p.comments_count * 3) + 
    (EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600)::int
  ) as trending_score
FROM public.posts p
WHERE 
  p.is_published = true AND
  p.created_at > now() - interval '7 days' AND
  p.privacy = 'public'
ORDER BY trending_score DESC;