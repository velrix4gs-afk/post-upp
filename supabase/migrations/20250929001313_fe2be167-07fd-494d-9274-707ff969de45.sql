-- Fix missing role column and other missing features
-- Add role column to chat_participants if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_participants' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_participants ADD COLUMN role text DEFAULT 'member';
    END IF;
END $$;

-- Fix security issue with users table
DROP POLICY IF EXISTS "Users can view all user profiles" ON public.users;

CREATE POLICY "Users can only view their own profile" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

-- Fix profiles table security
DROP POLICY IF EXISTS "Users can view all public profiles" ON public.profiles;

CREATE POLICY "Users can view public profiles or their own" 
ON public.profiles 
FOR SELECT 
USING (NOT is_private OR id = auth.uid());

-- Create message reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(message_id, user_id, reaction_type)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reactions on messages they can see" 
ON public.message_reactions 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.messages m 
    JOIN public.chat_participants cp ON m.chat_id = cp.chat_id 
    WHERE m.id = message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own reactions" 
ON public.message_reactions 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Users can view reactions on messages they can see" 
ON public.message_reactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m 
    JOIN public.chat_participants cp ON m.chat_id = cp.chat_id 
    WHERE m.id = message_id AND cp.user_id = auth.uid()
  )
);

-- Create message seen status table
CREATE TABLE IF NOT EXISTS public.message_seen (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seen_at timestamp with time zone DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can mark messages as seen" 
ON public.message_seen 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.messages m 
    JOIN public.chat_participants cp ON m.chat_id = cp.chat_id 
    WHERE m.id = message_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view seen status for their messages" 
ON public.message_seen 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages m 
    WHERE m.id = message_id AND (m.sender_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.chat_participants cp 
      WHERE cp.chat_id = m.chat_id AND cp.user_id = auth.uid()
    ))
  )
);

-- Replace the existing posts table
DROP TABLE IF EXISTS public.posts CASCADE;

CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  comments_count integer DEFAULT 0,
  reactions_count integer DEFAULT 0,
  privacy text DEFAULT 'public' CHECK (privacy IN ('public', 'friends', 'private'))
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Users can view posts based on privacy" 
ON public.posts 
FOR SELECT 
USING (
  privacy = 'public' OR 
  user_id = auth.uid() OR 
  (privacy = 'friends' AND EXISTS (
    SELECT 1 FROM public.friendships f 
    WHERE ((f.requester_id = auth.uid() AND f.addressee_id = user_id) OR 
           (f.requester_id = user_id AND f.addressee_id = auth.uid())) 
    AND f.status = 'accepted'
  ))
);

-- Create post reactions table
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL DEFAULT 'like',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id, reaction_type)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create post reactions" 
ON public.post_reactions 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id)
);

CREATE POLICY "Users can delete their own post reactions" 
ON public.post_reactions 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Users can view post reactions" 
ON public.post_reactions 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id)
);

-- Create post comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create comments on visible posts" 
ON public.post_comments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id)
);

CREATE POLICY "Users can update their own comments" 
ON public.post_comments 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Users can view comments on visible posts" 
ON public.post_comments 
FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id)
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  notification_messages boolean DEFAULT true,
  notification_friend_requests boolean DEFAULT true,
  notification_post_reactions boolean DEFAULT true,
  privacy_who_can_message text DEFAULT 'everyone' CHECK (privacy_who_can_message IN ('everyone', 'friends', 'nobody')),
  privacy_who_can_view_profile text DEFAULT 'everyone' CHECK (privacy_who_can_view_profile IN ('everyone', 'friends', 'nobody')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings" 
ON public.user_settings 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create trigger to auto-create user settings
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created_create_settings ON public.profiles;

CREATE TRIGGER on_profile_created_create_settings
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_user_settings();