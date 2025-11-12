-- Fix chat_participants INSERT policy to allow chat creators/admins to add members
-- This is needed for group chat creation

-- First, drop the restrictive policy
DROP POLICY IF EXISTS "Users can add themselves to chats" ON public.chat_participants;

-- Create a new policy that allows:
-- 1. Users to add themselves
-- 2. Chat creators/admins to add other users
CREATE POLICY "Users can add themselves or admins can add others"
ON public.chat_participants FOR INSERT
TO public
WITH CHECK (
  -- User adding themselves
  user_id = auth.uid()
  OR
  -- Chat creator adding participants during creation
  EXISTS (
    SELECT 1 FROM public.chats
    WHERE id = chat_id
    AND created_by = auth.uid()
  )
  OR
  -- Chat admin adding participants
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'admin'
  )
);