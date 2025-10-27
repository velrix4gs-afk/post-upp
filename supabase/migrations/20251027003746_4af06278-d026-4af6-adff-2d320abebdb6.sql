-- Fix Profile RLS Policy with WITH CHECK clause to prevent privilege escalation
-- This prevents users from modifying sensitive columns like is_verified

-- Drop existing vulnerable policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create secure policy with explicit column restrictions
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() AND
  -- Prevent modification of sensitive column is_verified
  is_verified = (SELECT is_verified FROM public.profiles WHERE id = auth.uid())
);

-- Add comment explaining the security measure
COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS 
'Secure UPDATE policy with WITH CHECK clause to prevent users from modifying sensitive columns like is_verified, ensuring monetization integrity';