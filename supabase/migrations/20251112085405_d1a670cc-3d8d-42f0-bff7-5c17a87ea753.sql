-- Fix profile RLS policies to prevent conflicts and allow proper updates
-- Drop conflicting UPDATE policies on profiles table
DROP POLICY IF EXISTS "Profiles update" ON public.profiles;
DROP POLICY IF EXISTS "Users can only update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create single, clear UPDATE policy that allows users to update their own profile
-- but prevents them from changing is_verified status
CREATE POLICY "users_can_update_own_profile"
ON public.profiles
FOR UPDATE
TO public
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND (
    -- Prevent changing is_verified status (only admins should change this)
    is_verified IS NOT DISTINCT FROM (SELECT is_verified FROM public.profiles WHERE id = auth.uid())
  )
);