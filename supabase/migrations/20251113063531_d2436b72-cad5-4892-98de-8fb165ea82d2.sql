-- Phase 4: Add page_metadata column for category-specific fields
ALTER TABLE creator_pages 
ADD COLUMN IF NOT EXISTS page_metadata JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN creator_pages.page_metadata IS 'Stores category-specific metadata for pages (business hours, services, etc.)';

-- Phase 6: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_bookmarks_user_id ON message_bookmarks(user_id);

-- Add comments
COMMENT ON INDEX idx_chat_participants_chat_id IS 'Improves chat participant lookup performance';
COMMENT ON INDEX idx_messages_chat_id IS 'Improves message fetching performance';
COMMENT ON INDEX idx_messages_sender_id IS 'Improves sender profile lookup performance';
COMMENT ON INDEX idx_message_bookmarks_user_id IS 'Improves starred messages lookup performance';
