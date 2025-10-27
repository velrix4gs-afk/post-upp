-- Add support for multiple media URLs in posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- Create presence tracking table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_chat_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence status" ON user_presence
  FOR UPDATE USING (auth.uid() = user_id);

-- Add chat settings columns
ALTER TABLE chats ADD COLUMN IF NOT EXISTS muted_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS theme_color TEXT;

-- Create export logs table
CREATE TABLE IF NOT EXISTS chat_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('txt', 'pdf', 'json')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own exports" ON chat_exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports" ON chat_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);