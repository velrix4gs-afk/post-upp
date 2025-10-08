-- Add created_by column to chats if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chats' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.chats ADD COLUMN created_by uuid;
  END IF;
END $$;

-- Update chats RLS policy to allow users to create chats
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;
CREATE POLICY "Users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add updated_at to chats if needed
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chats' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.chats ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- Add update policy for chats
DROP POLICY IF EXISTS "Users can update their chats" ON public.chats;
CREATE POLICY "Users can update their chats"
  ON public.chats FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_participants.chat_id = chats.id 
    AND chat_participants.user_id = auth.uid()
  ));