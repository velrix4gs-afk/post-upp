-- Drop existing RLS policy for stories viewing
DROP POLICY IF EXISTS "Users can view stories from friends" ON public.stories;

-- Create new policy to allow all authenticated users to view active stories
CREATE POLICY "Users can view active stories"
ON public.stories
FOR SELECT
TO authenticated
USING (
  expires_at > now()
);