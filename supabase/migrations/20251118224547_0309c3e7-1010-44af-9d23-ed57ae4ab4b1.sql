-- Create error_logs table for admin monitoring
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type TEXT NOT NULL, -- 'network', 'auth', 'database', 'storage', 'validation', 'unknown'
  error_code TEXT,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_agent TEXT,
  page_url TEXT,
  component_name TEXT,
  severity TEXT NOT NULL DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Admins can view all error logs"
ON public.error_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Only admins can update error logs (mark as resolved)
CREATE POLICY "Admins can update error logs"
ON public.error_logs
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Anyone can insert error logs (for logging)
CREATE POLICY "Anyone can insert error logs"
ON public.error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create message_queue table for offline sync
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  reply_to UUID,
  temp_id TEXT NOT NULL, -- Client-generated ID for tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed'
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create index for queue processing
CREATE INDEX IF NOT EXISTS idx_message_queue_user_status ON public.message_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_message_queue_created_at ON public.message_queue(created_at);

-- Enable RLS
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- Users can manage their own queue
CREATE POLICY "Users can manage their own message queue"
ON public.message_queue
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create offline_cache table for storing last viewed content
CREATE TABLE IF NOT EXISTS public.offline_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_type TEXT NOT NULL, -- 'posts', 'messages', 'chats', 'profiles'
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cache_type, cache_key)
);

-- Create index for cache lookups
CREATE INDEX IF NOT EXISTS idx_offline_cache_user_type ON public.offline_cache(user_id, cache_type);
CREATE INDEX IF NOT EXISTS idx_offline_cache_expires ON public.offline_cache(expires_at);

-- Enable RLS
ALTER TABLE public.offline_cache ENABLE ROW LEVEL SECURITY;

-- Users can manage their own cache
CREATE POLICY "Users can manage their own offline cache"
ON public.offline_cache
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add admin policies for posts (delete any post)
CREATE POLICY "Admins can delete any post"
ON public.posts
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add admin policy to view blocked users
CREATE POLICY "Admins can view all blocked users"
ON public.blocked_users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create notifications_read table for individual clearing
CREATE TABLE IF NOT EXISTS public.notifications_read (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cleared_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, notification_id)
);

-- Enable RLS
ALTER TABLE public.notifications_read ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notification reads
CREATE POLICY "Users can manage their own notification reads"
ON public.notifications_read
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);