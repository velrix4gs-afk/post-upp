-- Drop existing storage policies to recreate them properly
DROP POLICY IF EXISTS "Users can upload their own posts media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view posts media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own posts media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own message media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their message media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own message media" ON storage.objects;

-- Recreate all storage policies properly
-- Posts bucket policies
CREATE POLICY "Users can upload to posts bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view posts bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'posts');

CREATE POLICY "Users can delete own posts media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Avatars bucket policies
CREATE POLICY "Users can upload to avatars bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Covers bucket policies
CREATE POLICY "Users can upload to covers bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view covers"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'covers');

CREATE POLICY "Users can update own covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'covers' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Messages bucket policies (private)
CREATE POLICY "Users can upload to messages bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own message media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own message media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);