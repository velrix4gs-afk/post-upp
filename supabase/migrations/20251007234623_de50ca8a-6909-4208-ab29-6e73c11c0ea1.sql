-- Fix chat participants RLS policy to allow chat creation
DROP POLICY IF EXISTS "Only chat admins can add participants" ON chat_participants;

-- Allow users to add participants when creating a new chat or if they're already an admin
CREATE POLICY "Users can add participants to new chats or as admin"
ON chat_participants FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is adding themselves
  user_id = auth.uid() OR
  -- Allow if user is already an admin in this chat
  (EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'admin'
  ))
);