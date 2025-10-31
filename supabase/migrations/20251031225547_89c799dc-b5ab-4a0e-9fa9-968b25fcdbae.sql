-- Fix rate_limits table RLS policies
-- The rate_limits table has RLS enabled but no policies, making it completely inaccessible

-- Allow users to check their own rate limits
CREATE POLICY "users_check_rate_limits"
ON public.rate_limits FOR SELECT
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
);

-- Allow inserting new rate limit records
CREATE POLICY "users_create_rate_limits"
ON public.rate_limits FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
);

-- Allow updating existing rate limits
CREATE POLICY "users_update_rate_limits"
ON public.rate_limits FOR UPDATE
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
)
WITH CHECK (
  user_id = auth.uid() OR 
  (user_id IS NULL AND ip_address IS NOT NULL)
);