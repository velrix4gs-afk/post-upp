-- Fix search_path for all SECURITY DEFINER functions to prevent privilege escalation

-- 1. notify_post_reaction
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

-- 2. notify_post_comment
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

-- 3. notify_friend_request
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

-- 4. notify_follower
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

-- 5. update_post_counts
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

-- Make sensitive storage buckets private
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('messages', 'posts', 'stories', 'group-images');

-- Update storage policies for private buckets with signed URLs

-- Messages bucket policies (already exists but ensure it's correct)
DROP POLICY IF EXISTS "Users can view messages media in their chats" ON storage.objects;
CREATE POLICY "Users can view messages media in their chats" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'messages' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can upload to their messages folder" ON storage.objects;
CREATE POLICY "Users can upload to their messages folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'messages' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Posts bucket policies
DROP POLICY IF EXISTS "Users can view their own post media" ON storage.objects;
CREATE POLICY "Users can view their own post media" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'posts' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.media_urls::text LIKE '%' || name || '%'
        AND p.privacy = 'public'
    )
  )
);

DROP POLICY IF EXISTS "Users can upload to their posts folder" ON storage.objects;
CREATE POLICY "Users can upload to their posts folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Stories bucket policies
DROP POLICY IF EXISTS "Users can view unexpired stories" ON storage.objects;
CREATE POLICY "Users can view unexpired stories" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'stories' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM stories s
      WHERE s.media_url LIKE '%' || name || '%'
        AND s.expires_at > NOW()
    )
  )
);

DROP POLICY IF EXISTS "Users can upload to their stories folder" ON storage.objects;
CREATE POLICY "Users can upload to their stories folder" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'stories' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Group images bucket policies
DROP POLICY IF EXISTS "Group members can view group images" ON storage.objects;
CREATE POLICY "Group members can view group images" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'group-images' AND
  EXISTS (
    SELECT 1 FROM groups g
    JOIN group_members gm ON gm.group_id = g.id
    WHERE g.avatar_url LIKE '%' || name || '%'
      AND gm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Group admins can upload group images" ON storage.objects;
CREATE POLICY "Group admins can upload group images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'group-images' AND
  auth.uid() IS NOT NULL
);