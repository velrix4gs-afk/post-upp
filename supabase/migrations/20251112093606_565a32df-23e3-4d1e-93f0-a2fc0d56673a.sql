-- Create reels storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reels',
  'reels',
  true,
  209715200, -- 200MB limit
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm']
);

-- Allow authenticated users to upload their own reels
CREATE POLICY "Users can upload their own reels"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reels' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own reels
CREATE POLICY "Users can update their own reels"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reels' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own reels
CREATE POLICY "Users can delete their own reels"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reels' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public to view all reels
CREATE POLICY "Anyone can view reels"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reels');

-- Verify messages bucket exists and has proper video support
DO $$
BEGIN
  -- Update messages bucket to support video files if it exists
  UPDATE storage.buckets 
  SET 
    file_size_limit = 104857600, -- 100MB for videos
    allowed_mime_types = ARRAY[
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ]
  WHERE id = 'messages';
  
  -- If messages bucket doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'messages',
      'messages',
      false,
      104857600,
      ARRAY[
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
      ]
    );
    
    -- Add RLS policies for messages bucket
    CREATE POLICY "Users can upload to their chats"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'messages' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
    
    CREATE POLICY "Users can view messages in their chats"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'messages' AND
      EXISTS (
        SELECT 1 FROM chat_participants
        WHERE user_id = auth.uid()
        AND chat_id::text = (storage.foldername(name))[2]
      )
    );
    
    CREATE POLICY "Users can delete their own message media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'messages' AND
      auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;