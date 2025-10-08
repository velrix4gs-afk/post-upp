-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Function to create notification for post reactions
CREATE OR REPLACE FUNCTION public.notify_post_reaction()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
  reactor_name text;
BEGIN
  -- Get post owner and reactor name
  SELECT p.user_id, pr.display_name INTO post_owner_id, reactor_name
  FROM public.posts p
  JOIN public.profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;
  
  -- Only notify if someone else reacted (not the post owner)
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, content, data)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification for comments
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id uuid;
  commenter_name text;
BEGIN
  -- Get post owner and commenter name
  SELECT p.user_id, pr.display_name INTO post_owner_id, commenter_name
  FROM public.posts p
  JOIN public.profiles pr ON pr.id = NEW.user_id
  WHERE p.id = NEW.post_id;
  
  -- Only notify if someone else commented (not the post owner)
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, content, data)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification for friend requests
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name text;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' AND (TG_OP = 'INSERT' OR OLD.status != 'pending') THEN
    -- Get requester name
    SELECT display_name INTO requester_name
    FROM public.profiles
    WHERE id = NEW.requester_id;
    
    INSERT INTO public.notifications (user_id, type, title, content, data)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to create notification for follow requests
CREATE OR REPLACE FUNCTION public.notify_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name text;
BEGIN
  -- Only notify when someone follows (status = accepted)
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status != 'accepted') THEN
    -- Get follower name
    SELECT display_name INTO follower_name
    FROM public.profiles
    WHERE id = NEW.follower_id;
    
    INSERT INTO public.notifications (user_id, type, title, content, data)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_post_reaction_created ON public.post_reactions;
DROP TRIGGER IF EXISTS on_post_comment_created ON public.post_comments;
DROP TRIGGER IF EXISTS on_friendship_created ON public.friendships;
DROP TRIGGER IF EXISTS on_follower_created ON public.followers;

-- Create triggers
CREATE TRIGGER on_post_reaction_created
  AFTER INSERT ON public.post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_reaction();

CREATE TRIGGER on_post_comment_created
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_post_comment();

CREATE TRIGGER on_friendship_created
  AFTER INSERT OR UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_friend_request();

CREATE TRIGGER on_follower_created
  AFTER INSERT OR UPDATE ON public.followers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_follower();