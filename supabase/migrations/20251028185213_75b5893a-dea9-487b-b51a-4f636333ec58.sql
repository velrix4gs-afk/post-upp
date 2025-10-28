-- Add starred messages table
CREATE TABLE IF NOT EXISTS public.starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add scheduled messages table
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent BOOLEAN DEFAULT FALSE
);

-- Add chat nicknames table
CREATE TABLE IF NOT EXISTS public.chat_nicknames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  nickname TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id, target_user_id)
);

-- Add rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  ip_address TEXT,
  action TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  last_attempt TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_nicknames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Starred messages policies
CREATE POLICY "Users can star messages in their chats"
  ON public.starred_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.chat_participants cp ON m.chat_id = cp.chat_id
      WHERE m.id = message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their starred messages"
  ON public.starred_messages FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their starred messages"
  ON public.starred_messages FOR DELETE
  USING (user_id = auth.uid());

-- Scheduled messages policies
CREATE POLICY "Users can create scheduled messages"
  ON public.scheduled_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their scheduled messages"
  ON public.scheduled_messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Users can update their scheduled messages"
  ON public.scheduled_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their scheduled messages"
  ON public.scheduled_messages FOR DELETE
  USING (sender_id = auth.uid());

-- Chat nicknames policies
CREATE POLICY "Users can set nicknames in their chats"
  ON public.chat_nicknames FOR ALL
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chat_nicknames.chat_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_id = chat_nicknames.chat_id AND user_id = auth.uid()
    )
  );

-- Fix profiles RLS - prevent privilege escalation
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can only update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_starred_messages_user ON public.starred_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_starred_messages_message ON public.starred_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON public.scheduled_messages(scheduled_for) WHERE NOT sent;
CREATE INDEX IF NOT EXISTS idx_chat_nicknames_lookup ON public.chat_nicknames(chat_id, user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON public.rate_limits(user_id, action, last_attempt);

-- Update messages bucket to private (will be handled separately)
-- Add last_seen column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
    ALTER TABLE public.profiles ADD COLUMN last_seen TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create index for last_seen
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC);