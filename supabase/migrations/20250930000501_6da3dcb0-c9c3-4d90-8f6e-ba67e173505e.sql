-- Fix security definer views and search path issues
-- Drop and recreate views without security definer to fix the security warnings

-- Remove existing problematic views and recreate them properly
DROP VIEW IF EXISTS public.messages_view CASCADE;
DROP VIEW IF EXISTS public.conversations_view CASCADE;
DROP VIEW IF EXISTS public.posts_view CASCADE;
DROP VIEW IF EXISTS public.message_reactions_view CASCADE;
DROP VIEW IF EXISTS public.message_seen_view CASCADE;
DROP VIEW IF EXISTS public.profiles_view CASCADE;
DROP VIEW IF EXISTS public.settings_view CASCADE;

-- Messages view with reactions and seen status (without security definer)
CREATE VIEW public.messages_view AS
SELECT 
  m.id as message_id,
  m.chat_id,
  m.sender_id,
  m.content,
  m.media_url,
  m.status,
  m.created_at,
  p.display_name as sender_name,
  p.avatar_url as sender_avatar,
  COALESCE(r.reaction_count, 0) as reaction_count,
  COALESCE(s.seen_count, 0) as seen_count
FROM public.messages m
JOIN public.profiles p ON m.sender_id = p.id
LEFT JOIN (
  SELECT message_id, COUNT(*) as reaction_count
  FROM public.message_reactions
  GROUP BY message_id
) r ON m.id = r.message_id
LEFT JOIN (
  SELECT message_id, COUNT(*) as seen_count
  FROM public.message_seen
  GROUP BY message_id
) s ON m.id = s.message_id;

-- Posts view for social feed (without security definer)
CREATE VIEW public.posts_view AS
SELECT 
  p.id as post_id,
  p.user_id as author_id,
  p.content,
  p.media_url,
  p.media_type,
  p.privacy,
  p.created_at,
  p.updated_at,
  pr.display_name as author_name,
  pr.avatar_url as author_avatar,
  p.comments_count,
  p.reactions_count
FROM public.posts p
JOIN public.profiles pr ON p.user_id = pr.id;

-- Message reactions view (without security definer)
CREATE VIEW public.message_reactions_view AS
SELECT 
  mr.message_id,
  mr.reaction_type,
  COUNT(*) as count,
  array_agg(
    json_build_object(
      'user_id', mr.user_id,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'created_at', mr.created_at
    )
  ) as users
FROM public.message_reactions mr
JOIN public.profiles p ON mr.user_id = p.id
GROUP BY mr.message_id, mr.reaction_type;

-- Message seen view (without security definer)
CREATE VIEW public.message_seen_view AS
SELECT 
  ms.message_id,
  ms.user_id,
  ms.seen_at,
  p.display_name,
  p.avatar_url
FROM public.message_seen ms
JOIN public.profiles p ON ms.user_id = p.id;

-- Profile settings view (without security definer)
CREATE VIEW public.profiles_view AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.bio,
  p.avatar_url,
  p.cover_url,
  p.location,
  p.website,
  p.birth_date,
  p.relationship_status,
  p.theme_color,
  p.is_private,
  p.is_verified,
  p.last_seen,
  p.created_at,
  p.updated_at,
  us.notification_messages,
  us.notification_friend_requests,
  us.notification_post_reactions,
  us.privacy_who_can_message,
  us.privacy_who_can_view_profile
FROM public.profiles p
LEFT JOIN public.user_settings us ON p.id = us.user_id;

-- Settings view (without security definer)
CREATE VIEW public.settings_view AS
SELECT 
  us.*,
  p.display_name,
  p.username,
  p.avatar_url
FROM public.user_settings us
JOIN public.profiles p ON us.user_id = p.id;

-- Simplified conversations view (without security definer)
CREATE VIEW public.conversations_view AS
SELECT 
  c.id as chat_id,
  c.name as chat_name,
  c.avatar_url as chat_avatar,
  c.type,
  c.created_at as chat_created_at
FROM public.chats c;

-- Fix function search path issues
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;