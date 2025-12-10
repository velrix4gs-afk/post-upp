-- Fix user_roles privilege escalation vulnerability
-- Block all client-side modifications to user_roles table

-- Drop any existing policies that might conflict (if they exist)
DROP POLICY IF EXISTS "Block all role inserts" ON public.user_roles;
DROP POLICY IF EXISTS "Block all role updates" ON public.user_roles;
DROP POLICY IF EXISTS "Block all role deletes" ON public.user_roles;

-- Create restrictive policies that block all client-side modifications
-- Role management should only happen via edge functions using service role key

CREATE POLICY "Block all role inserts" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Block all role updates" 
ON public.user_roles 
FOR UPDATE 
USING (false);

CREATE POLICY "Block all role deletes" 
ON public.user_roles 
FOR DELETE 
USING (false);