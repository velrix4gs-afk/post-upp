-- Add RLS policies to friends table to match friendships functionality
-- (The friends table appears to be unused but has RLS enabled)

CREATE POLICY "Users can view their own friendships"
ON friends FOR SELECT
TO authenticated
USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can create friend requests"
ON friends FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update friendship status"
ON friends FOR UPDATE
TO authenticated
USING (requester_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can delete their friendships"
ON friends FOR DELETE
TO authenticated
USING (requester_id = auth.uid() OR receiver_id = auth.uid());