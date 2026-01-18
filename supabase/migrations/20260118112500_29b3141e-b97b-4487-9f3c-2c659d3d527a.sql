-- Fix 4: Secure reported_users table - proper access controls
-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Allow edge inserts" ON public.reported_users;
DROP POLICY IF EXISTS "Allow edge select" ON public.reported_users;
DROP POLICY IF EXISTS "Allow edge updates" ON public.reported_users;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON public.reported_users;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reported_users;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reported_users;
DROP POLICY IF EXISTS "Admins can update report status" ON public.reported_users;

-- Authenticated users can report others
CREATE POLICY "Authenticated users can create reports"
ON public.reported_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports"
ON public.reported_users FOR SELECT
TO authenticated
USING (reporter_id = auth.uid());

-- Only admins can view all reports and update status
CREATE POLICY "Admins can view all reports"
ON public.reported_users FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update report status"
ON public.reported_users FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 5: Secure groups table - require authentication
DROP POLICY IF EXISTS "Allow insert on groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;

-- Only authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Fix 6: Secure profile_views table - require authentication
DROP POLICY IF EXISTS "Anyone can insert" ON public.profile_views;
DROP POLICY IF EXISTS "Anyone can insert profile views" ON public.profile_views;
DROP POLICY IF EXISTS "Authenticated users can log profile views" ON public.profile_views;

-- Only authenticated users can log profile views
CREATE POLICY "Authenticated users can log profile views"
ON public.profile_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id);

-- Fix 7: Secure user_reel_interests table
DROP POLICY IF EXISTS "System can manage" ON public.user_reel_interests;
DROP POLICY IF EXISTS "System can manage user_reel_interests" ON public.user_reel_interests;
DROP POLICY IF EXISTS "Users can view their own reel interests" ON public.user_reel_interests;
DROP POLICY IF EXISTS "Users can insert their own reel interests" ON public.user_reel_interests;
DROP POLICY IF EXISTS "Users can update their own reel interests" ON public.user_reel_interests;
DROP POLICY IF EXISTS "Users can delete their own reel interests" ON public.user_reel_interests;

-- Users can only manage their own reel interests
CREATE POLICY "Users can view their own reel interests"
ON public.user_reel_interests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reel interests"
ON public.user_reel_interests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reel interests"
ON public.user_reel_interests FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reel interests"
ON public.user_reel_interests FOR DELETE
TO authenticated
USING (user_id = auth.uid());