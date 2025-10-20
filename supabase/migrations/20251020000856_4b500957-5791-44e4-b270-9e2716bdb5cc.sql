-- Drop all existing overlapping INSERT policies for chats
DROP POLICY IF EXISTS "authenticated_can_create_chat" ON public.chats;
DROP POLICY IF EXISTS "authenticated_users_can_create_private_chats" ON public.chats;

-- Drop existing chat_participants INSERT policy
DROP POLICY IF EXISTS "chat_creator_can_add_participants" ON public.chat_participants;

-- Create single, clear INSERT policy for chats
CREATE POLICY "users_can_create_their_own_chats" 
  ON public.chats 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    created_by = auth.uid() 
    AND (
      (type = 'private') OR 
      (type = 'group' AND created_by = auth.uid())
    )
  );

-- Create simplified INSERT policy for chat_participants
CREATE POLICY "authenticated_can_add_participants" 
  ON public.chat_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    -- User can add themselves to any chat
    (user_id = auth.uid()) OR
    -- Or user is the creator of the chat they're adding to
    (EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = chat_participants.chat_id 
      AND chats.created_by = auth.uid()
    ))
  );

-- Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON public.chats(created_by);
CREATE INDEX IF NOT EXISTS idx_chats_type ON public.chats(type);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_user ON public.chat_participants(chat_id, user_id);