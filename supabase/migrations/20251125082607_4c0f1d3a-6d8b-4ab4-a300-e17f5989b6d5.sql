-- Add verification fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_type TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_note TEXT;

-- Create index for verified users
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified) WHERE is_verified = true;

-- Create admin-only function to update verification status
CREATE OR REPLACE FUNCTION update_user_verification(
  target_user_id UUID,
  verified BOOLEAN,
  v_type TEXT DEFAULT NULL,
  v_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can update verification status';
  END IF;

  -- Update the profile
  UPDATE profiles
  SET 
    is_verified = verified,
    verification_type = v_type,
    verified_at = CASE WHEN verified THEN NOW() ELSE NULL END,
    verification_note = v_note,
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION update_user_verification TO authenticated;