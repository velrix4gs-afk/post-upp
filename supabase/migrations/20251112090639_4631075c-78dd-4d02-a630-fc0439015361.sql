-- Phase 1: Reels Tables
CREATE TABLE IF NOT EXISTS public.reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  duration INTEGER,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reel_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  watch_duration INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reel_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.reel_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type TEXT DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reel_id, user_id, reaction_type)
);

CREATE TABLE IF NOT EXISTS public.reel_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.reel_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_reel_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  hashtag TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest_score INTEGER DEFAULT 1,
  last_interaction TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: Message Bookmarks
CREATE TABLE IF NOT EXISTS public.message_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Add media_type to messages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN media_type TEXT;
  END IF;
END $$;

-- RLS Policies for Reels
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published reels"
ON public.reels FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reels"
ON public.reels FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reels"
ON public.reels FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reels"
ON public.reels FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for Reel Views
ALTER TABLE public.reel_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reel views"
ON public.reel_views FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reel views"
ON public.reel_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Reel Reactions
ALTER TABLE public.reel_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reel reactions"
ON public.reel_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reel reactions"
ON public.reel_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel reactions"
ON public.reel_reactions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for Reel Comments
ALTER TABLE public.reel_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reel comments"
ON public.reel_comments FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reel comments"
ON public.reel_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reel comments"
ON public.reel_comments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reel comments"
ON public.reel_comments FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for Message Bookmarks
ALTER TABLE public.message_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
ON public.message_bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
ON public.message_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON public.message_bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for User Reel Interests
ALTER TABLE public.user_reel_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interests"
ON public.user_reel_interests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage user interests"
ON public.user_reel_interests FOR ALL
USING (true)
WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_reels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reels_updated_at
BEFORE UPDATE ON public.reels
FOR EACH ROW
EXECUTE FUNCTION update_reels_updated_at();

-- Function to increment reel views (already exists but ensuring it's there)
CREATE OR REPLACE FUNCTION public.increment_reel_views(reel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.reels
  SET views_count = views_count + 1
  WHERE id = reel_id;
END;
$function$;

-- Function to get recommended reels
CREATE OR REPLACE FUNCTION public.get_recommended_reels(
  p_user_id uuid,
  p_page_offset integer DEFAULT 0,
  p_page_size integer DEFAULT 10
)
RETURNS TABLE(
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
  creator_name varchar,
  creator_avatar text,
  is_verified boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH user_follows AS (
    SELECT following_id FROM follows WHERE follower_id = p_user_id
  ),
  user_interests AS (
    SELECT DISTINCT hashtag, creator_id 
    FROM user_reel_interests 
    WHERE user_reel_interests.user_id = p_user_id
  ),
  scored_reels AS (
    SELECT 
      r.*,
      p.display_name as creator_name,
      p.avatar_url as creator_avatar,
      p.is_verified,
      CASE
        WHEN r.user_id IN (SELECT following_id FROM user_follows) THEN 40
        WHEN EXISTS (
          SELECT 1 FROM user_interests ui 
          WHERE ui.creator_id = r.user_id 
          OR r.caption ILIKE '%' || ui.hashtag || '%'
        ) THEN 30
        WHEN r.views_count > 1000 THEN 20
        ELSE 10
      END as relevance_score,
      RANDOM() as random_factor
    FROM reels r
    JOIN profiles p ON p.id = r.user_id
    WHERE r.user_id != p_user_id
    AND NOT EXISTS (
      SELECT 1 FROM reel_views rv 
      WHERE rv.reel_id = r.id 
      AND rv.user_id = p_user_id 
      AND rv.completed = true
    )
  )
  SELECT 
    sr.id,
    sr.user_id,
    sr.video_url,
    sr.thumbnail_url,
    sr.caption,
    sr.duration,
    sr.views_count,
    sr.likes_count,
    sr.comments_count,
    sr.shares_count,
    sr.created_at,
    sr.creator_name,
    sr.creator_avatar,
    sr.is_verified
  FROM scored_reels sr
  ORDER BY sr.relevance_score DESC, sr.random_factor DESC
  LIMIT p_page_size
  OFFSET p_page_offset;
END;
$function$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reels_user_id ON public.reels(user_id);
CREATE INDEX IF NOT EXISTS idx_reels_created_at ON public.reels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reel_views_user_reel ON public.reel_views(user_id, reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_reactions_reel_id ON public.reel_reactions(reel_id);
CREATE INDEX IF NOT EXISTS idx_reel_comments_reel_id ON public.reel_comments(reel_id);
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_user_id ON public.message_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reel_interests_user_id ON public.user_reel_interests(user_id);