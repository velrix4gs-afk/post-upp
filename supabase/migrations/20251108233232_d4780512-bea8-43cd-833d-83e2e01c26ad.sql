-- Update the handle_new_user function to automatically assign a verification code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code VARCHAR(12);
BEGIN
  -- Create profile
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text from 1 for 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Create user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Generate and assign verification code
  new_code := generate_verification_code();
  INSERT INTO public.verification_codes (
    code,
    user_id,
    status,
    issued_at
  )
  VALUES (
    new_code,
    NEW.id,
    'issued',
    NOW()
  );
  
  RETURN NEW;
END;
$$;