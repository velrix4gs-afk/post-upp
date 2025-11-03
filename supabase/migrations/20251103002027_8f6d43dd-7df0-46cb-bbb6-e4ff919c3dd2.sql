-- Fix 1: Add admin/moderator access to reported_users table
CREATE POLICY "Admins can view all reports"
ON public.reported_users FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can update reports"
ON public.reported_users FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Fix 2: Create server-side rate limiting function
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
AS $$
DECLARE
  v_rate_limit record;
  v_now timestamp with time zone := now();
  v_window_start timestamp with time zone := v_now - (p_window_seconds || ' seconds')::interval;
  v_blocked_until timestamp with time zone;
  v_attempt_count integer;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_rate_limit
  FROM public.rate_limits
  WHERE user_id = p_user_id AND action = p_action
  FOR UPDATE;

  -- Check if currently blocked
  IF v_rate_limit.blocked_until IS NOT NULL AND v_rate_limit.blocked_until > v_now THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked_until', v_rate_limit.blocked_until,
      'reason', 'Rate limit exceeded'
    );
  END IF;

  -- Check if within time window
  IF v_rate_limit.id IS NOT NULL AND v_rate_limit.last_attempt > v_window_start THEN
    v_attempt_count := v_rate_limit.attempt_count + 1;
    
    -- Block if exceeded max attempts
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
    
    -- Increment attempt count
    UPDATE public.rate_limits
    SET attempt_count = v_attempt_count,
        last_attempt = v_now
    WHERE id = v_rate_limit.id;
    
    RETURN jsonb_build_object(
      'allowed', true,
      'remaining_attempts', p_max_attempts - v_attempt_count
    );
  ELSE
    -- Outside window or first attempt, reset/create
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
$$;