-- Security Fix: Add search_path to all SECURITY DEFINER functions
-- This prevents SQL injection via search_path manipulation

-- Fix generate_verification_code
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS VARCHAR(12) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix log_verification_audit
CREATE OR REPLACE FUNCTION public.log_verification_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix validate_creator_slug
CREATE OR REPLACE FUNCTION public.validate_creator_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Slug must contain only lowercase letters, numbers, and hyphens';
  END IF;
  IF LENGTH(NEW.slug) < 3 OR LENGTH(NEW.slug) > 50 THEN
    RAISE EXCEPTION 'Slug must be between 3 and 50 characters';
  END IF;
  RETURN NEW;
END;
$$;

-- Fix create_user_settings
CREATE OR REPLACE FUNCTION public.create_user_settings()
RETURNS trigger
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

-- Fix init_user_settings
CREATE OR REPLACE FUNCTION public.init_user_settings()
RETURNS trigger
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

-- Fix update_post_counts
CREATE OR REPLACE FUNCTION public.update_post_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix sync_follow_to_friendship
CREATE OR REPLACE FUNCTION public.sync_follow_to_friendship()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix update_post_shares_count
CREATE OR REPLACE FUNCTION public.update_post_shares_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET shares_count = GREATEST(0, shares_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix extract_hashtags
CREATE OR REPLACE FUNCTION public.extract_hashtags(post_content text)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashtag_array text[];
BEGIN
  SELECT array_agg(DISTINCT lower(regexp_replace(match[1], '^#', '')))
  INTO hashtag_array
  FROM regexp_matches(post_content, '#(\w+)', 'g') AS match;
  
  RETURN COALESCE(hashtag_array, ARRAY[]::text[]);
END;
$$;

-- Fix update_post_shares
CREATE OR REPLACE FUNCTION public.update_post_shares()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix create_chat
CREATE OR REPLACE FUNCTION public.create_chat(_creator uuid, _receiver uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_chat_id UUID;
BEGIN
    INSERT INTO chats (creator_id, receiver_id, created_at)
    VALUES (_creator, _receiver, NOW())
    RETURNING id INTO new_chat_id;
    RETURN new_chat_id;
END;
$$;

-- Fix create_message
CREATE OR REPLACE FUNCTION public.create_message(_chat_id uuid, _sender uuid, _receiver uuid, _content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_msg_id UUID;
BEGIN
    INSERT INTO messages (chat_id, sender_id, receiver_id, content, created_at)
    VALUES (_chat_id, _sender, _receiver, _content, NOW())
    RETURNING id INTO new_msg_id;
    RETURN new_msg_id;
END;
$$;

-- Fix create_private_chat
CREATE OR REPLACE FUNCTION public.create_private_chat(_user1 uuid, _user2 uuid)
RETURNS TABLE(chat_id uuid, target_user uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix send_message
CREATE OR REPLACE FUNCTION public.send_message(_chat_id uuid, _sender_id uuid, _content text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix rate_limits RLS policies to prevent OR condition exploit
DROP POLICY IF EXISTS "users_check_rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "users_create_rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "users_update_rate_limits" ON public.rate_limits;

-- Only allow viewing own rate limits
CREATE POLICY "users_view_own_rate_limits"
ON public.rate_limits FOR SELECT
USING (user_id = auth.uid());

-- System-only management via SECURITY DEFINER functions
CREATE POLICY "system_manage_rate_limits"
ON public.rate_limits FOR ALL
USING (false)
WITH CHECK (false);