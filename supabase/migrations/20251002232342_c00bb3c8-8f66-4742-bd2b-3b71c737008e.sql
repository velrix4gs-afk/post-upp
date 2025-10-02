-- Ensure all authenticated users can access key features
-- Update profiles RLS to allow all authenticated users to view profiles
DROP POLICY IF EXISTS "Users can view public profiles or their own" ON public.profiles;
CREATE POLICY "Anyone authenticated can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Ensure posts are viewable by all authenticated users
DROP POLICY IF EXISTS "Users can view posts based on privacy" ON public.posts;
CREATE POLICY "Users can view all public and friends posts" 
ON public.posts 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    privacy = 'public'::text 
    OR user_id = auth.uid() 
    OR (
      privacy = 'friends'::text 
      AND EXISTS (
        SELECT 1 FROM friendships f 
        WHERE (
          (f.requester_id = auth.uid() AND f.addressee_id = posts.user_id) 
          OR (f.requester_id = posts.user_id AND f.addressee_id = auth.uid())
        ) 
        AND f.status = 'accepted'::text
      )
    )
  )
);

-- Ensure message features are accessible to all authenticated users
-- Messages should be viewable only by chat participants
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- Create function to auto-create profile on signup if not exists
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text from 1 for 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Also create user_settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure story views and reactions are accessible
DROP POLICY IF EXISTS "Users can view story views of their own stories" ON public.story_views;
CREATE POLICY "Story owners can see who viewed their stories" 
ON public.story_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM stories 
    WHERE stories.id = story_views.story_id 
    AND stories.user_id = auth.uid()
  )
);