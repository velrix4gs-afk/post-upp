-- Fix RLS policy for chats to allow authenticated users to create chats
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

CREATE POLICY "Users can create chats" 
ON public.chats 
FOR INSERT 
TO authenticated
WITH CHECK (true);