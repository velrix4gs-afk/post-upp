-- Comprehensive messaging system enhancements

-- 1. Blocked users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their blocks"
  ON public.blocked_users FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Reported users table
CREATE TABLE IF NOT EXISTS public.reported_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  chat_id UUID REFERENCES public.chats(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.reported_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.reported_users FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their reports"
  ON public.reported_users FOR SELECT
  USING (auth.uid() = reporter_id);

-- 3. Chat settings table (mute, pin, wallpaper, etc.)
CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  wallpaper_url TEXT,
  theme_color TEXT,
  auto_delete_duration INTEGER, -- seconds, null for never
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their chat settings"
  ON public.chat_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Starred messages (if not exists)
CREATE TABLE IF NOT EXISTS public.starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their starred messages"
  ON public.starred_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Message translations
CREATE TABLE IF NOT EXISTS public.message_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_language TEXT,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, target_language)
);

ALTER TABLE public.message_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their translations"
  ON public.message_translations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Scheduled messages
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage scheduled messages"
  ON public.scheduled_messages FOR ALL
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- 7. Add columns to messages table for enhanced features
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edit_deadline TIMESTAMPTZ;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON public.blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON public.blocked_users(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_reported_users_status ON public.reported_users(status);
CREATE INDEX IF NOT EXISTS idx_chat_settings_user_id ON public.chat_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_is_pinned ON public.chat_settings(is_pinned) WHERE is_pinned = TRUE;
CREATE INDEX IF NOT EXISTS idx_starred_messages_user_id ON public.starred_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_for ON public.scheduled_messages(scheduled_for) WHERE sent = FALSE;

-- 9. Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(check_user_id UUID, by_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE user_id = by_user_id AND blocked_user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;