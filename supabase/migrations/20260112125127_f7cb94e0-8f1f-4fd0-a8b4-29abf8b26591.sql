-- Fix infinite recursion in profiles RLS policy
-- The policy "users_can_update_own_profile" has a WITH CHECK that self-references profiles table

-- 1) Remove the recursive policy that causes "infinite recursion detected in policy"
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.profiles;

-- 2) Ensure users cannot modify verification/system-managed fields via column-level privileges
-- This is safer than RLS self-queries and prevents recursion
REVOKE UPDATE (is_verified, verified_at, verification_type, verification_note, is_active, is_profile_complete, created_at)
ON public.profiles
FROM anon, authenticated;

REVOKE INSERT (is_verified, verified_at, verification_type, verification_note, is_active, is_profile_complete)
ON public.profiles
FROM anon, authenticated;