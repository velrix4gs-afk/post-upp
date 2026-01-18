-- Clean up remaining overly permissive policies

-- Fix email_otps - there's still a public policy
DROP POLICY IF EXISTS "System can insert OTPs" ON public.email_otps;

-- Fix hashtags - there's still the old public policy  
DROP POLICY IF EXISTS "System can manage hashtags" ON public.hashtags;

-- Fix user_reel_interests - there's still the old public policy
DROP POLICY IF EXISTS "System can manage user interests" ON public.user_reel_interests;

-- Fix error_logs - should require auth.uid() check
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;

CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Fix verification_audit - should be service role only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.verification_audit;

CREATE POLICY "Service role only - insert audit logs"
ON public.verification_audit FOR INSERT
TO service_role
WITH CHECK (true);

-- The service_role policies for chat_messages, chat_settings, message_attachments, posts 
-- are acceptable because they're explicitly restricted to service_role which is trusted
-- These are needed for edge functions to work properly