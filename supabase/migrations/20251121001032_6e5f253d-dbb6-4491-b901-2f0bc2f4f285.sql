-- Add is_profile_complete field to profiles to track setup status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT false;

-- Mark existing users with usernames as complete
UPDATE public.profiles 
SET is_profile_complete = true 
WHERE username IS NOT NULL AND username != '';

-- Create function to check if profile is discoverable
CREATE OR REPLACE FUNCTION public.is_profile_discoverable(profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_complete boolean;
  has_creator_page boolean;
  is_verified_user boolean;
BEGIN
  -- Check if profile is complete
  SELECT is_profile_complete, is_verified
  INTO profile_complete, is_verified_user
  FROM profiles
  WHERE id = profile_user_id;

  -- Check if user has a creator page
  SELECT EXISTS(
    SELECT 1 FROM creator_pages WHERE user_id = profile_user_id
  ) INTO has_creator_page;

  -- User is discoverable if:
  -- 1. Profile is complete, OR
  -- 2. They have a creator page, OR
  -- 3. They are verified
  RETURN profile_complete OR has_creator_page OR is_verified_user;
END;
$$;