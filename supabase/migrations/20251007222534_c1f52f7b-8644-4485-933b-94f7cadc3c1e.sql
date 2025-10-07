-- Fix critical security issues with RLS policies

-- 1. Fix messages table - only allow sending to chats user is part of
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.messages;

CREATE POLICY "Users can only send messages to their chats"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  is_chat_participant(chat_id, auth.uid())
);

-- 2. Fix chat_participants - only admins can add participants
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;

CREATE POLICY "Only chat admins can add participants"
ON public.chat_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp
    WHERE cp.chat_id = chat_participants.chat_id 
      AND cp.user_id = auth.uid() 
      AND cp.role = 'admin'
  )
);

-- 3. Fix events visibility - only show to attendees and friends
DROP POLICY IF EXISTS "Users can view all events" ON public.events;

CREATE POLICY "Users can view events they attend or created"
ON public.events
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.event_attendees
    WHERE event_id = events.id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.friendships
    WHERE ((requester_id = auth.uid() AND addressee_id = events.created_by) OR
           (addressee_id = auth.uid() AND requester_id = events.created_by))
      AND status = 'accepted'
  )
);

-- 4. Fix event attendees visibility
DROP POLICY IF EXISTS "Users can view event attendees" ON public.event_attendees;

CREATE POLICY "Users can view attendees of events they can see"
ON public.event_attendees
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE id = event_id AND (
      created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.event_attendees ea
        WHERE ea.event_id = events.id AND ea.user_id = auth.uid()
      )
    )
  )
);

-- 5. Fix typing status - only allow for chats user is part of
DROP POLICY IF EXISTS "Users can update their own typing status" ON public.typing_status;

CREATE POLICY "Users can set typing status in their chats"
ON public.typing_status
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  is_chat_participant(chat_id, auth.uid())
);

DROP POLICY IF EXISTS "Users can update their typing status" ON public.typing_status;

CREATE POLICY "Users can update their typing status in their chats"
ON public.typing_status
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND
  is_chat_participant(chat_id, auth.uid())
);