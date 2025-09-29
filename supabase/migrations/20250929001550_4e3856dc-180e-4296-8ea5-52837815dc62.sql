-- Create missing SQL views for the comprehensive messaging system

-- Messages view with reactions and seen status
CREATE OR REPLACE VIEW public.messages_view AS
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

-- Conversations view
CREATE OR REPLACE VIEW public.conversations_view AS
SELECT 
  c.id as chat_id,
  c.name as chat_name,
  c.avatar_url as chat_avatar,
  c.type,
  c.created_at as chat_created_at,
  lm.content as last_message,
  lm.created_at as last_message_at,
  lm.sender_name as last_message_sender,
  COALESCE(uc.unread_count, 0) as unread_count,
  array_agg(
    json_build_object(
      'user_id', cp.user_id,
      'role', cp.role,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url
    )
  ) as participants
FROM public.chats c
JOIN public.chat_participants cp ON c.id = cp.chat_id
JOIN public.profiles p ON cp.user_id = p.id
LEFT JOIN (
  SELECT DISTINCT ON (chat_id) 
    chat_id, content, created_at, sender_name
  FROM public.messages_view
  ORDER BY chat_id, created_at DESC
) lm ON c.id = lm.chat_id
LEFT JOIN (
  SELECT 
    m.chat_id,
    COUNT(*) as unread_count
  FROM public.messages m
  LEFT JOIN public.message_seen ms ON m.id = ms.message_id AND ms.user_id = auth.uid()
  WHERE ms.id IS NULL AND m.sender_id != auth.uid()
  GROUP BY m.chat_id
) uc ON c.id = uc.chat_id
GROUP BY c.id, c.name, c.avatar_url, c.type, c.created_at, lm.content, lm.created_at, lm.sender_name, uc.unread_count;

-- Posts view for social feed
CREATE OR REPLACE VIEW public.posts_view AS
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

-- Message reactions view
CREATE OR REPLACE VIEW public.message_reactions_view AS
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

-- Message seen view
CREATE OR REPLACE VIEW public.message_seen_view AS
SELECT 
  ms.message_id,
  ms.user_id,
  ms.seen_at,
  p.display_name,
  p.avatar_url
FROM public.message_seen ms
JOIN public.profiles p ON ms.user_id = p.id;

-- Profile settings view
CREATE OR REPLACE VIEW public.profiles_view AS
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

-- Settings view
CREATE OR REPLACE VIEW public.settings_view AS
SELECT 
  us.*,
  p.display_name,
  p.username,
  p.avatar_url
FROM public.user_settings us
JOIN public.profiles p ON us.user_id = p.id;

-- Update triggers for post counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'post_reactions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET reactions_count = reactions_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET reactions_count = reactions_count - 1 WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_post_reactions_count ON public.post_reactions;
DROP TRIGGER IF EXISTS update_post_comments_count ON public.post_comments;

CREATE TRIGGER update_post_reactions_count
  AFTER INSERT OR DELETE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();

CREATE TRIGGER update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_counts();