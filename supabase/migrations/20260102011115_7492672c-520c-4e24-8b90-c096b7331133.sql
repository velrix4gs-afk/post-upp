-- Enable RLS on view_backups table and add admin-only policy
ALTER TABLE public.view_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view backups"
ON public.view_backups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add RLS policy for migration_audit table (admin only)
CREATE POLICY "Only admins can view migration audit"
ON public.migration_audit FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix function search_path for chat_messages_broadcast_trigger
CREATE OR REPLACE FUNCTION public.chat_messages_broadcast_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM realtime.broadcast_changes(
    'room:' || COALESCE(NEW.chat_id, OLD.chat_id)::text,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    json_build_object('id', COALESCE(NEW.id, OLD.id), 'chat_id', COALESCE(NEW.chat_id, OLD.chat_id), 'sender_id', COALESCE(NEW.sender_id, OLD.sender_id), 'created_at', COALESCE(NEW.created_at, OLD.created_at))::jsonb,
    NULL
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix function search_path for ensure_user_settings
CREATE OR REPLACE FUNCTION public.ensure_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Fix function search_path for get_chat_list
CREATE OR REPLACE FUNCTION public.get_chat_list()
RETURNS TABLE(chat_id uuid, type text, chat_name text, chat_created_at timestamp with time zone, other_user_id uuid, other_user_name text, other_user_avatar text, last_message_id uuid, last_message text, last_message_at timestamp with time zone, last_message_status text, unread_count integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  WITH my_chats AS (
    SELECT c.*
    FROM public.chats c
    JOIN public.chat_participants cp ON cp.chat_id = c.id
    WHERE cp.user_id = (SELECT auth.uid())
  ),
  participant_others AS (
    SELECT
      mc.id AS chat_id,
      mc.type,
      mc.name AS chat_name,
      mc.created_at AS chat_created_at,
      (SELECT p2.user_id
       FROM public.chat_participants p2
       WHERE p2.chat_id = mc.id AND p2.user_id <> (SELECT auth.uid())
       LIMIT 1) AS other_user_id
    FROM my_chats mc
  ),
  last_msgs AS (
    SELECT m.chat_id, m.id AS last_message_id, m.content AS last_message, m.created_at AS last_message_at, m.status AS last_message_status
    FROM public.messages m
    JOIN (
      SELECT chat_id, max(created_at) AS max_created_at
      FROM public.messages
      GROUP BY chat_id
    ) mm ON m.chat_id = mm.chat_id AND m.created_at = mm.max_created_at
  ),
  unread_counts AS (
    SELECT chat_id, COUNT(*)::int AS unread_count
    FROM public.messages msg
    WHERE (msg.deleted_at IS NULL)
      AND NOT ( (SELECT auth.uid()) = ANY (msg.deleted_for) )
      AND msg.status = 'sent'
      AND msg.chat_id IS NOT NULL
    GROUP BY chat_id
  ),
  user_profiles AS (
    SELECT id, username, avatar_url
    FROM public.profiles
  )
  SELECT
    po.chat_id,
    po.type,
    po.chat_name,
    po.chat_created_at,
    po.other_user_id,
    up.username  AS other_user_name,
    up.avatar_url AS other_user_avatar,
    lm.last_message_id,
    lm.last_message,
    lm.last_message_at,
    lm.last_message_status,
    COALESCE(uc.unread_count, 0) AS unread_count
  FROM participant_others po
  LEFT JOIN last_msgs lm ON lm.chat_id = po.chat_id
  LEFT JOIN unread_counts uc ON uc.chat_id = po.chat_id
  LEFT JOIN user_profiles up ON up.id = po.other_user_id
  ORDER BY COALESCE(lm.last_message_at, po.chat_created_at) DESC;
$function$;