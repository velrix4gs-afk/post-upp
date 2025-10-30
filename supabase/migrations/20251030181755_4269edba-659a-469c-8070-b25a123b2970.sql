-- Drop ALL existing policies on messages table
DROP POLICY IF EXISTS "Allow insert for sender" ON public.messages;
DROP POLICY IF EXISTS "Allow select for participants" ON public.messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages from chats they're in" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "message_sender_can_select" ON public.messages;
DROP POLICY IF EXISTS "messages_participants_can_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_participants_can_select" ON public.messages;
DROP POLICY IF EXISTS "view_messages_in_own_chat" ON public.messages;

-- Create clean, simple RLS policies
CREATE POLICY "messages_select_policy"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_policy"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_participants
      WHERE chat_participants.chat_id = messages.chat_id
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "messages_update_policy"
  ON public.messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_delete_policy"
  ON public.messages
  FOR DELETE
  USING (sender_id = auth.uid());