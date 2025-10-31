-- Fix 1: Enable RLS on follows table and add proper policies
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Users can view follows where they are either the follower or following
CREATE POLICY "Users can view their own follows"
ON public.follows FOR SELECT
USING (
  follower_id = auth.uid() OR following_id = auth.uid()
);

-- Users can create follows where they are the follower
CREATE POLICY "Users can create their own follows"
ON public.follows FOR INSERT
WITH CHECK (follower_id = auth.uid());

-- Users can delete their own follows
CREATE POLICY "Users can delete their own follows"
ON public.follows FOR DELETE
USING (follower_id = auth.uid());

-- Users can update their own follows (for status changes)
CREATE POLICY "Users can update their own follows"
ON public.follows FOR UPDATE
USING (follower_id = auth.uid() OR following_id = auth.uid())
WITH CHECK (follower_id = auth.uid() OR following_id = auth.uid());

-- Fix 2: Resolve infinite recursion in chat_participants by cleaning up duplicate policies
-- Drop all existing policies on chat_participants
DROP POLICY IF EXISTS "Allow users to insert themselves into chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow users to view their chat participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat participants insert" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat participants view" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants of chats they're in" ON public.chat_participants;
DROP POLICY IF EXISTS "authenticated_can_add_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "authenticated_select_participants_for_user" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_add_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "users_can_view_chat_participants" ON public.chat_participants;
DROP POLICY IF EXISTS "view_self_in_chat" ON public.chat_participants;

-- The is_chat_participant function already exists, so we'll use it
-- Create clean, non-recursive policies
CREATE POLICY "Users can view chat participants"
ON public.chat_participants FOR SELECT
USING (is_chat_participant(chat_id, auth.uid()));

CREATE POLICY "Users can add themselves to chats"
ON public.chat_participants FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participation"
ON public.chat_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove themselves from chats"
ON public.chat_participants FOR DELETE
USING (user_id = auth.uid());

-- Fix 3: Resolve infinite recursion in group_members by cleaning up policies
-- Drop existing recursive policies
DROP POLICY IF EXISTS "Admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Members viewable by group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave or admins can remove" ON public.group_members;

-- Create security definer function for group membership check
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function for group admin check
CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
      AND role = 'admin'
  )
$$;

-- Create clean policies using security definer functions
CREATE POLICY "Users can view group members"
ON public.group_members FOR SELECT
USING (
  is_group_member(group_id, auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND privacy = 'public'
  )
);

CREATE POLICY "Users can join public groups"
ON public.group_members FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND privacy = 'public'
  )
);

CREATE POLICY "Admins can manage group members"
ON public.group_members FOR UPDATE
USING (is_group_admin(group_id, auth.uid()));

CREATE POLICY "Users can leave groups or admins can remove"
ON public.group_members FOR DELETE
USING (
  user_id = auth.uid() OR
  is_group_admin(group_id, auth.uid())
);

-- Fix 4: Resolve infinite recursion in comments by cleaning up policies
-- Drop existing recursive policies
DROP POLICY IF EXISTS "Create comments" ON public.comments;
DROP POLICY IF EXISTS "Update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on visible posts" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON public.comments;
DROP POLICY IF EXISTS "View comments" ON public.comments;

-- Create clean, non-recursive policies
CREATE POLICY "Users can view comments"
ON public.comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_id
  )
);

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_id
  )
);

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
USING (user_id = auth.uid());

-- Fix 5: Add storage RLS policies for all non-public buckets
-- Posts bucket
CREATE POLICY "Users can upload posts to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'posts' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view posts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'posts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update own posts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own posts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'posts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Messages bucket
CREATE POLICY "Users can upload messages to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'messages' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Chat participants can view messages"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'messages' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete own messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'messages' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Group images bucket
CREATE POLICY "Group members can upload group images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'group-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view group images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'group-images' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete group images they uploaded"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'group-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Stories bucket
CREATE POLICY "Users can upload stories to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'stories' AND
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view all stories"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'stories' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete own stories"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'stories' AND
  (storage.foldername(name))[1] = auth.uid()::text
);