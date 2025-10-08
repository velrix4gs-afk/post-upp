-- Fix RLS policy for chats creation
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

CREATE POLICY "Users can create chats" 
ON public.chats 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also ensure the policy for viewing chats is correct
DROP POLICY IF EXISTS "Users can view chats they're part of" ON public.chats;

CREATE POLICY "Users can view chats they're part of" 
ON public.chats 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE chat_participants.chat_id = chats.id 
    AND chat_participants.user_id = auth.uid()
  )
);