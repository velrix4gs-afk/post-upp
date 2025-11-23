-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own error logs" ON error_logs;
DROP POLICY IF EXISTS "Users can view their own error logs" ON error_logs;
DROP POLICY IF EXISTS "Admins can view all error logs" ON error_logs;

-- Error logging system (table already exists, just ensuring it's there)
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  error_code TEXT,
  error_message TEXT NOT NULL,
  error_type TEXT NOT NULL,
  context JSONB,
  component_name TEXT,
  page_url TEXT,
  user_agent TEXT,
  stack_trace TEXT,
  severity TEXT DEFAULT 'error',
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add chat tracking columns
ALTER TABLE chats 
ADD COLUMN IF NOT EXISTS last_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_pinned_posts_user_id ON pinned_posts(user_id);

-- Enable RLS on error_logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Re-create policies
CREATE POLICY "Users can insert their own error logs"
ON error_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own error logs"
ON error_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all error logs"
ON error_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);