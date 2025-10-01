-- Create followers table for follow system
CREATE TABLE IF NOT EXISTS public.followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for followers
CREATE POLICY "Users can create follow requests"
  ON public.followers FOR INSERT
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can view their followers/following"
  ON public.followers FOR SELECT
  USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can update follow requests they received"
  ON public.followers FOR UPDATE
  USING (following_id = auth.uid());

CREATE POLICY "Users can delete their follows"
  ON public.followers FOR DELETE
  USING (follower_id = auth.uid());

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookmarks
CREATE POLICY "Users can create their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- Add gender and phone to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE public.profiles ADD COLUMN gender TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_follower ON public.followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following ON public.followers(following_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON public.bookmarks(post_id);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE followers;
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;