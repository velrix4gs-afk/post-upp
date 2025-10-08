-- Add starred messages table
CREATE TABLE public.starred_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, message_id)
);

-- Add deleted_for to messages for WhatsApp-style deletion
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS deleted_for uuid[],
ADD COLUMN IF NOT EXISTS is_forwarded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS forwarded_from_message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL;

-- Enable RLS on starred_messages
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

-- Policies for starred_messages
CREATE POLICY "Users can view their own starred messages"
ON public.starred_messages FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can star messages"
ON public.starred_messages FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unstar messages"
ON public.starred_messages FOR DELETE
USING (user_id = auth.uid());

-- Add index for better performance
CREATE INDEX idx_starred_messages_user_id ON public.starred_messages(user_id);
CREATE INDEX idx_starred_messages_message_id ON public.starred_messages(message_id);
CREATE INDEX idx_messages_deleted_for ON public.messages USING GIN(deleted_for);