-- Migration to improve chat RLS policies for UUID-based creation

-- Drop existing problematic policies on chats table
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
DROP POLICY IF EXISTS "chat_create_by_user" ON public.chats;

-- Create comprehensive RLS policy for chat creation
CREATE POLICY "authenticated_users_can_create_private_chats"
ON public.chats
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() 
  AND type = 'private'
);

-- Ensure chat participants policies allow proper UUID-based insertion
DROP POLICY IF EXISTS "Users can add participants to chats" ON public.chat_participants;
DROP POLICY IF EXISTS "authenticated_can_insert_participants_self_or_creator" ON public.chat_participants;

-- Comprehensive participant insertion policy
CREATE POLICY "chat_creator_can_add_participants"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can add themselves
  user_id = auth.uid()
  OR
  -- Or user is the creator of the chat
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = chat_participants.chat_id
    AND chats.created_by = auth.uid()
  )
);

-- Add index for better performance on chat participant lookups
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_chat 
ON public.chat_participants(user_id, chat_id);

CREATE INDEX IF NOT EXISTS idx_chats_created_by 
ON public.chats(created_by);

-- Add comments for documentation
COMMENT ON POLICY "authenticated_users_can_create_private_chats" ON public.chats IS 
'Allows authenticated users to create private chats they own';

COMMENT ON POLICY "chat_creator_can_add_participants" ON public.chat_participants IS
'Allows chat creators to add participants and users to add themselves to chats';