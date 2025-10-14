-- Add SELECT policy for message_reads so users can see read receipts
CREATE POLICY "Users can view read receipts in their chats"
ON public.message_reads FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.chat_participants cp ON cp.chat_id = m.chat_id
    WHERE m.id = message_reads.message_id
      AND cp.user_id = auth.uid()
  )
);