-- Create function to auto-create friendship when following someone
CREATE OR REPLACE FUNCTION public.sync_follow_to_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When a follow is created or updated to accepted, create/update friendship
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'accepted' THEN
    -- Try to insert friendship, ignore if exists
    INSERT INTO public.friendships (
      requester_id,
      addressee_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.follower_id,
      NEW.following_id,
      'accepted',
      NOW(),
      NOW()
    )
    ON CONFLICT (requester_id, addressee_id) 
    DO UPDATE SET 
      status = 'accepted',
      updated_at = NOW();
  END IF;

  -- When a follow is deleted, remove friendship
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.friendships
    WHERE (
      (requester_id = OLD.follower_id AND addressee_id = OLD.following_id) OR
      (requester_id = OLD.following_id AND addressee_id = OLD.follower_id)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for syncing follows to friendships
DROP TRIGGER IF EXISTS sync_follow_to_friendship_trigger ON public.followers;
CREATE TRIGGER sync_follow_to_friendship_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_follow_to_friendship();

-- Add unique constraint to friendships if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'friendships_unique_pair'
  ) THEN
    ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_unique_pair 
    UNIQUE (requester_id, addressee_id);
  END IF;
END $$;