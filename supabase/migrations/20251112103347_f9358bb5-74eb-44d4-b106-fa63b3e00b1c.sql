-- Fix RLS policy for chat_participants to allow group chat creation
DROP POLICY IF EXISTS "Users can add themselves or admins can add others" ON chat_participants;

CREATE POLICY "Users can add participants to chats"
ON chat_participants FOR INSERT
TO public
WITH CHECK (
  -- Users can add themselves
  user_id = auth.uid()
  OR
  -- OR if they're the chat creator (for group creation)
  EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = chat_participants.chat_id 
    AND chats.created_by = auth.uid()
  )
  OR
  -- OR if they're already an admin in the chat
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'admin'
  )
);

-- Update reels storage bucket to allow up to 500MB files
UPDATE storage.buckets 
SET file_size_limit = 524288000 
WHERE id = 'reels';

-- Update messages storage bucket to support videos up to 100MB
UPDATE storage.buckets 
SET file_size_limit = 104857600 
WHERE id = 'messages';

-- Clean up orphaned chats (older than 24 hours with no participants)
DELETE FROM chats 
WHERE id NOT IN (
  SELECT DISTINCT chat_id FROM chat_participants
)
AND created_at < NOW() - INTERVAL '24 hours';