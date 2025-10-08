-- Fix storage policies for avatars bucket to allow authenticated users to upload their own files

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Create proper RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Do the same for covers bucket
DROP POLICY IF EXISTS "Users can upload their own cover" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own cover" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own cover" ON storage.objects;

CREATE POLICY "Users can upload their own cover"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view covers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'covers');

CREATE POLICY "Users can update their own cover"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own cover"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);