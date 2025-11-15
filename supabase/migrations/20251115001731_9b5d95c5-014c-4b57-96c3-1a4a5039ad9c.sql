-- Grant admin role and verification to the specified user
-- First ensure the user has a profile (if not exists)
INSERT INTO public.profiles (
  id,
  username,
  display_name,
  is_verified,
  created_at,
  updated_at
)
VALUES (
  '7da3b515-6b14-4b96-946c-cd9f9ffbd4c0',
  'admin_user',
  'Admin User',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET 
  is_verified = true,
  updated_at = NOW();

-- Grant admin role
INSERT INTO public.user_roles (
  user_id,
  role
)
VALUES (
  '7da3b515-6b14-4b96-946c-cd9f9ffbd4c0',
  'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Ensure user settings exist
INSERT INTO public.user_settings (
  user_id
)
VALUES (
  '7da3b515-6b14-4b96-946c-cd9f9ffbd4c0'
)
ON CONFLICT (user_id) DO NOTHING;