-- Fix RLS policies for creator_pages
DROP POLICY IF EXISTS "Users can insert their own pages" ON creator_pages;
DROP POLICY IF EXISTS "Users can create their own pages" ON creator_pages;

CREATE POLICY "Users can create their own pages"
ON creator_pages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pages" ON creator_pages;

CREATE POLICY "Users can update their own pages"
ON creator_pages FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix RLS policies for reels
DROP POLICY IF EXISTS "Users can create their own reels" ON reels;

CREATE POLICY "Users can create their own reels"
ON reels FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reels" ON reels;

CREATE POLICY "Users can update their own reels"
ON reels FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure storage policy allows reel uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload reels'
  ) THEN
    CREATE POLICY "Users can upload reels"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'reels' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;