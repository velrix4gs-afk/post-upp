-- Fix posts RLS policies to work properly with edge functions
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can view all public and friends posts" ON public.posts;

-- Recreate policies with better logic
CREATE POLICY "Users can create their own posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own posts"
ON public.posts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own posts"
ON public.posts
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can view all public and friends posts"
ON public.posts
FOR SELECT
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND (
    (privacy = 'public') OR 
    (user_id = auth.uid()) OR
    (
      (privacy = 'friends') AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE (
          (f.requester_id = auth.uid() AND f.addressee_id = posts.user_id) OR
          (f.addressee_id = auth.uid() AND f.requester_id = posts.user_id)
        ) AND f.status = 'accepted'
      )
    )
  )
);

-- Fix chats RLS to allow creation
DROP POLICY IF EXISTS "Users can create chats" ON public.chats;

CREATE POLICY "Users can create chats"
ON public.chats
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix chat_participants to allow adding yourself to new chats
DROP POLICY IF EXISTS "Users can add participants to new chats or as admin" ON public.chat_participants;

CREATE POLICY "Users can add participants to chats"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id
    AND cp.user_id = auth.uid()
    AND cp.role = 'admin'
  )
);

-- Fix messages RLS 
DROP POLICY IF EXISTS "Users can only send messages to their chats" ON public.messages;

CREATE POLICY "Users can send messages to their chats"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  is_chat_participant(chat_id, auth.uid())
);