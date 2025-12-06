-- Enable real-time for followers table
ALTER TABLE public.followers REPLICA IDENTITY FULL;

-- Enable real-time for posts table
ALTER TABLE public.posts REPLICA IDENTITY FULL;

-- Add followers and posts to realtime publication (profiles already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.followers;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;