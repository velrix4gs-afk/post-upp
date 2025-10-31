-- Fix infinite recursion in group policies
-- The issue: groups policies query group_members, and group_members policies query groups
-- Solution: Use security definer functions that bypass RLS

-- First, drop problematic policies on groups table that cause recursion
DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Public groups viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Groups visibility" ON public.groups;
DROP POLICY IF EXISTS "Users can view their own groups" ON public.groups;

-- Recreate policies using security definer functions to avoid recursion
CREATE POLICY "admins_can_delete_groups"
ON public.groups FOR DELETE
USING (
  auth.uid() = created_by OR
  is_group_admin(id, auth.uid())
);

CREATE POLICY "admins_can_update_groups"
ON public.groups FOR UPDATE
USING (
  auth.uid() = created_by OR
  is_group_admin(id, auth.uid())
)
WITH CHECK (
  auth.uid() = created_by OR
  is_group_admin(id, auth.uid())
);

CREATE POLICY "view_public_and_member_groups"
ON public.groups FOR SELECT
USING (
  privacy = 'public' OR
  created_by = auth.uid() OR
  is_group_member(id, auth.uid())
);

-- Fix chat_participants admin delete policy
-- Current policy only allows self-removal, but UI shows admin remove button
DROP POLICY IF EXISTS "Users can remove themselves from chats" ON public.chat_participants;

CREATE POLICY "users_and_admins_can_remove_participants"
ON public.chat_participants FOR DELETE
USING (
  user_id = auth.uid() OR  -- Self-removal
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'admin'
  )
);

-- Fix security definer function without search_path
DROP FUNCTION IF EXISTS public.get_random_feed(uuid);

CREATE OR REPLACE FUNCTION public.get_random_feed(user_uuid uuid)
RETURNS SETOF posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.posts
  WHERE (is_public = true OR is_public IS NULL)
  AND (
    user_id IN (
      SELECT following_id
      FROM public.follows
      WHERE follower_id = user_uuid
    )
    OR RANDOM() < 0.3
  )
  ORDER BY RANDOM()
  LIMIT 20;
END;
$$;