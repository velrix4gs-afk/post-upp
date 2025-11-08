-- Fix database functions missing search_path
-- Add search_path to all SECURITY DEFINER functions

-- update_page_followers_count
CREATE OR REPLACE FUNCTION public.update_page_followers_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pages 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.page_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pages 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.page_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- get_random_feed
CREATE OR REPLACE FUNCTION public.get_random_feed(user_uuid uuid)
RETURNS SETOF posts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- make_group_creator_admin
CREATE OR REPLACE FUNCTION public.make_group_creator_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'admin';
  RETURN NEW;
END;
$function$;

-- update_post_reposts_count (already has search_path but ensuring it's correct)
CREATE OR REPLACE FUNCTION public.update_post_reposts_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET reposts_count = reposts_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET reposts_count = GREATEST(0, reposts_count - 1) 
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- check_and_increment_rate_limit
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_attempts integer DEFAULT 10,
  p_window_seconds integer DEFAULT 60,
  p_block_duration_seconds integer DEFAULT 300
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_rate_limit record;
  v_now timestamp with time zone := now();
  v_window_start timestamp with time zone := v_now - (p_window_seconds || ' seconds')::interval;
  v_blocked_until timestamp with time zone;
  v_attempt_count integer;
BEGIN
  SELECT * INTO v_rate_limit
  FROM public.rate_limits
  WHERE user_id = p_user_id AND action = p_action
  FOR UPDATE;

  IF v_rate_limit.blocked_until IS NOT NULL AND v_rate_limit.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked_until', v_rate_limit.blocked_until,
      'reason', 'Rate limit exceeded'
    );
  END IF;

  IF v_rate_limit.id IS NOT NULL AND v_rate_limit.last_attempt > v_window_start THEN
    v_attempt_count := v_rate_limit.attempt_count + 1;
    
    IF v_attempt_count > p_max_attempts THEN
      v_blocked_until := v_now + (p_block_duration_seconds || ' seconds')::interval;
      
      UPDATE public.rate_limits
      SET attempt_count = v_attempt_count,
          last_attempt = v_now,
          blocked_until = v_blocked_until
      WHERE id = v_rate_limit.id;
      
      RETURN jsonb_build_object(
        'allowed', false,
        'blocked_until', v_blocked_until,
        'reason', 'Rate limit exceeded'
      );
    END IF;
    
    UPDATE public.rate_limits
    SET attempt_count = v_attempt_count,
        last_attempt = v_now
    WHERE id = v_rate_limit.id;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining_attempts', p_max_attempts - v_attempt_count
    );
  ELSE
    IF v_rate_limit.id IS NOT NULL THEN
      UPDATE public.rate_limits
      SET attempt_count = 1,
          last_attempt = v_now,
          blocked_until = NULL
      WHERE id = v_rate_limit.id;
    ELSE
      INSERT INTO public.rate_limits (user_id, action, attempt_count, last_attempt)
      VALUES (p_user_id, p_action, 1, v_now);
    END IF;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining_attempts', p_max_attempts - 1
    );
  END IF;
END;
$function$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text from 1 for 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

-- handle_post_visibility
CREATE OR REPLACE FUNCTION public.handle_post_visibility()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE posts
  SET is_published = true
  WHERE user_id = auth.uid() AND is_deleted = false;
END;
$function$;

-- safe_error_message
CREATE OR REPLACE FUNCTION public.safe_error_message(error_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN CASE
    WHEN error_text ILIKE '%permission%' THEN 'Access denied.'
    WHEN error_text ILIKE '%relation%' THEN 'Database reference issue.'
    WHEN error_text ILIKE '%syntax%' THEN 'Invalid query or malformed request.'
    ELSE 'Unexpected internal error occurred.'
  END;
END;
$function$;

-- generate_verification_code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_code VARCHAR(12);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000000000)::VARCHAR, 12, '0');
    SELECT EXISTS(SELECT 1 FROM public.verification_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$function$;

-- log_verification_audit
CREATE OR REPLACE FUNCTION public.log_verification_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.verification_audit (code_id, operator_id, action, details)
    VALUES (NEW.id, auth.uid(), 'created', jsonb_build_object('code', NEW.code, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.verification_audit (code_id, operator_id, action, details)
      VALUES (NEW.id, auth.uid(), 
        CASE 
          WHEN NEW.status = 'used' THEN 'used'
          WHEN NEW.status = 'revoked' THEN 'revoked'
          WHEN NEW.status = 'issued' THEN 'issued'
          ELSE 'updated'
        END,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'user_id', NEW.user_id));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- validate_creator_slug
CREATE OR REPLACE FUNCTION public.validate_creator_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Slug must contain only lowercase letters, numbers, and hyphens';
  END IF;
  IF LENGTH(NEW.slug) < 3 OR LENGTH(NEW.slug) > 50 THEN
    RAISE EXCEPTION 'Slug must be between 3 and 50 characters';
  END IF;
  RETURN NEW;
END;
$function$;

-- notify_friend_request
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  requester_name text;
BEGIN
  IF NEW.status = 'pending' AND (TG_OP = 'INSERT' OR OLD.status != 'pending') THEN
    SELECT display_name INTO requester_name
    FROM profiles
    WHERE id = NEW.requester_id;
    
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (
      NEW.addressee_id,
      'friend_request',
      'New friend request',
      requester_name || ' sent you a friend request',
      jsonb_build_object('friendship_id', NEW.id, 'requester_id', NEW.requester_id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- auto_add_group_creator
CREATE OR REPLACE FUNCTION public.auto_add_group_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$function$;

-- auto_add_event_creator
CREATE OR REPLACE FUNCTION public.auto_add_event_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.event_attendees (event_id, user_id)
  VALUES (NEW.id, NEW.created_by);
  RETURN NEW;
END;
$function$;

-- update_post_shares_count
CREATE OR REPLACE FUNCTION public.update_post_shares_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- create_user_settings
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- extract_hashtags
CREATE OR REPLACE FUNCTION public.extract_hashtags(post_content text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  hashtag_array text[];
BEGIN
  SELECT array_agg(DISTINCT lower(regexp_replace(match[1], '^#', '')))
  INTO hashtag_array
  FROM regexp_matches(post_content, '#(\w+)', 'g') AS match;
  
  RETURN COALESCE(hashtag_array, ARRAY[]::text[]);
END;
$function$;

-- create_chat
CREATE OR REPLACE FUNCTION public.create_chat(_creator uuid, _receiver uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_chat_id UUID;
BEGIN
    INSERT INTO chats (creator_id, receiver_id, created_at)
    VALUES (_creator, _receiver, NOW())
    RETURNING id INTO new_chat_id;
    RETURN new_chat_id;
END;
$function$;

-- create_message
CREATE OR REPLACE FUNCTION public.create_message(_chat_id uuid, _sender uuid, _receiver uuid, _content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_msg_id UUID;
BEGIN
    INSERT INTO messages (chat_id, sender_id, receiver_id, content, created_at)
    VALUES (_chat_id, _sender, _receiver, _content, NOW())
    RETURNING id INTO new_msg_id;
    RETURN new_msg_id;
END;
$function$;

-- notify_follower
CREATE OR REPLACE FUNCTION public.notify_follower()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  follower_name text;
BEGIN
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status != 'accepted') THEN
    SELECT display_name INTO follower_name
    FROM profiles
    WHERE id = NEW.follower_id;
    
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (
      NEW.following_id,
      'follow',
      'New follower',
      follower_name || ' started following you',
      jsonb_build_object('follower_id', NEW.follower_id, 'follow_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- init_user_settings
CREATE OR REPLACE FUNCTION public.init_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- messages_broadcast_trigger
CREATE OR REPLACE FUNCTION public.messages_broadcast_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  topic text;
BEGIN
  topic := 'chat:' || COALESCE(NEW.chat_id, OLD.chat_id)::text || ':messages';

  PERFORM realtime.broadcast_changes(
    topic,
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- notify_post_reaction
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_owner_id uuid;
  reactor_name text;
BEGIN
  SELECT p.user_id, pr.display_name INTO post_owner_id, reactor_name
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;
  
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (
      post_owner_id,
      'like',
      'New reaction on your post',
      reactor_name || ' liked your post',
      jsonb_build_object('post_id', NEW.post_id, 'user_id', NEW.user_id, 'reaction_type', NEW.reaction_type)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- notify_post_comment
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  post_owner_id uuid;
  commenter_name text;
BEGIN
  SELECT p.user_id, pr.display_name INTO post_owner_id, commenter_name
  FROM posts p
  JOIN profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;
  
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (
      post_owner_id,
      'comment',
      'New comment on your post',
      commenter_name || ' commented on your post',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'user_id', NEW.user_id)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- update_post_shares
CREATE OR REPLACE FUNCTION public.update_post_shares()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET shares_count = shares_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET shares_count = shares_count - 1 
    WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- update_post_counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- sync_follow_to_friendship
CREATE OR REPLACE FUNCTION public.sync_follow_to_friendship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'accepted' THEN
    INSERT INTO public.friendships (
      requester_id,
      addressee_id,
      status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.follower_id,
      NEW.following_id,
      'accepted',
      NOW(),
      NOW()
    )
    ON CONFLICT (requester_id, addressee_id) 
    DO UPDATE SET 
      status = 'accepted',
      updated_at = NOW();
  END IF;

  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.friendships
    WHERE (
      (requester_id = OLD.follower_id AND addressee_id = OLD.following_id) OR
      (requester_id = OLD.following_id AND addressee_id = OLD.follower_id)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- update_poll_option_votes
CREATE OR REPLACE FUNCTION public.update_poll_option_votes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.poll_options 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.poll_options 
    SET votes_count = votes_count - 1 
    WHERE id = OLD.option_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- create_private_chat
CREATE OR REPLACE FUNCTION public.create_private_chat(_user1 uuid, _user2 uuid)
RETURNS TABLE(chat_id uuid, target_user uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO chats (created_at)
    VALUES (NOW())
    RETURNING id INTO new_id;

    INSERT INTO chat_participants (chat_id, user_id)
    VALUES (new_id, _user1), (new_id, _user2);

    RETURN QUERY SELECT new_id, _user2;
END;
$function$;

-- send_message
CREATE OR REPLACE FUNCTION public.send_message(_chat_id uuid, _sender_id uuid, _content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _message_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO messages (id, chat_id, sender_id, content)
  VALUES (_message_id, _chat_id, _sender_id, _content);

  UPDATE chats
  SET last_message_at = NOW()
  WHERE id = _chat_id;

  RETURN _message_id;
END;
$function$;

-- Add schema for disappearing messages support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS auto_delete_enabled boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Add chat settings table if not exists
CREATE TABLE IF NOT EXISTS chat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  auto_delete_duration integer, -- in seconds
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat settings"
  ON chat_settings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);