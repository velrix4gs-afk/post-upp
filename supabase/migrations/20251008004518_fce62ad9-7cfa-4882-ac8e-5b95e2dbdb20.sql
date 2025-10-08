-- Fix storage RLS policies for messages bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own message files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to view files in chats they're part of
CREATE POLICY "Users can view message files from their chats"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'messages' 
  AND (
    -- Allow viewing own files
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Allow viewing files from chats they're in
    EXISTS (
      SELECT 1 FROM chat_participants
      WHERE chat_participants.user_id = auth.uid()
    )
  )
);

-- Allow users to delete their own message files
CREATE POLICY "Users can delete their own message files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'messages' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);