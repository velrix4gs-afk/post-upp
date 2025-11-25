-- Fix search_path for update_user_verification function
CREATE OR REPLACE FUNCTION update_user_verification(
  target_user_id UUID,
  verified BOOLEAN,
  v_type TEXT DEFAULT NULL,
  v_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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