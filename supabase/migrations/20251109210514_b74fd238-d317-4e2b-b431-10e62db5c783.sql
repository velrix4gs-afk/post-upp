-- Create function to increment reel views
CREATE OR REPLACE FUNCTION public.increment_reel_views(reel_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.reels
  SET views_count = views_count + 1
  WHERE id = reel_id;
END;
$$;