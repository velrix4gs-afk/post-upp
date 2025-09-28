-- Fix RLS policies for tables that don't have them
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for likes
CREATE POLICY "Users can view all likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON public.likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (user_id = auth.uid());

-- RLS policies for messages
CREATE POLICY "Users can view messages from chats they're in" ON public.messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_participants 
  WHERE chat_id = messages.chat_id AND user_id = auth.uid()
));

CREATE POLICY "Users can create messages in chats they're in" ON public.messages FOR INSERT 
WITH CHECK (sender_id = auth.uid() AND EXISTS (
  SELECT 1 FROM public.chat_participants 
  WHERE chat_id = messages.chat_id AND user_id = auth.uid()
));

-- RLS policies for typing_status
CREATE POLICY "Users can view typing status in their chats" ON public.typing_status FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_participants 
  WHERE chat_id = typing_status.chat_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update their own typing status" ON public.typing_status FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their typing status" ON public.typing_status FOR UPDATE 
USING (user_id = auth.uid());

-- RLS policies for users (this might be a custom table, not auth.users)
CREATE POLICY "Users can view all user profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (id = auth.uid());

-- RLS policies for chats
CREATE POLICY "Users can view chats they're part of" ON public.chats FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_participants 
  WHERE chat_id = chats.id AND user_id = auth.uid()
));

CREATE POLICY "Users can create chats" ON public.chats FOR INSERT WITH CHECK (true);

-- RLS policies for chat_participants
CREATE POLICY "Users can view participants of chats they're in" ON public.chat_participants FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.chat_participants cp 
  WHERE cp.chat_id = chat_participants.chat_id AND cp.user_id = auth.uid()
));

CREATE POLICY "Users can join chats" ON public.chat_participants FOR INSERT WITH CHECK (user_id = auth.uid());