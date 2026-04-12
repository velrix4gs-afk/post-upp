
CREATE OR REPLACE FUNCTION public.notify_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  comment_owner_id uuid;
  liker_name text;
  v_post_id uuid;
BEGIN
  -- Get comment owner and post_id
  SELECT c.user_id, c.post_id INTO comment_owner_id, v_post_id
  FROM comments c
  WHERE c.id = NEW.comment_id;

  -- Get liker display name
  SELECT display_name INTO liker_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- Don't notify if liking your own comment
  IF comment_owner_id IS NOT NULL AND comment_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, content, data)
    VALUES (
      comment_owner_id,
      'comment_like',
      'Someone liked your comment',
      liker_name || ' liked your comment',
      jsonb_build_object('comment_id', NEW.comment_id, 'user_id', NEW.user_id, 'post_id', v_post_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_like_notify
AFTER INSERT ON public.comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_comment_like();
