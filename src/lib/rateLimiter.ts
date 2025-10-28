import { supabase } from '@/integrations/supabase/client';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

const defaultConfig: RateLimitConfig = {
  maxAttempts: 10,
  windowMs: 60000, // 1 minute
  blockDurationMs: 300000, // 5 minutes
};

export const checkRateLimit = async (
  action: string,
  userId?: string,
  ipAddress?: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remainingAttempts?: number; blockedUntil?: Date }> => {
  const identifier = userId || ipAddress;
  if (!identifier) {
    return { allowed: true };
  }

  try {
    // Check if user is currently blocked
    const { data: existing } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('action', action)
      .or(userId ? `user_id.eq.${userId}` : `ip_address.eq.${ipAddress}`)
      .single();

    const now = new Date();

    if (existing) {
      // Check if still blocked
      if (existing.blocked_until && new Date(existing.blocked_until) > now) {
        return {
          allowed: false,
          blockedUntil: new Date(existing.blocked_until),
        };
      }

      // Check if within time window
      const lastAttempt = new Date(existing.last_attempt);
      const timeSinceLastAttempt = now.getTime() - lastAttempt.getTime();

      if (timeSinceLastAttempt < config.windowMs) {
        // Within window, increment count
        const newCount = existing.attempt_count + 1;

        if (newCount > config.maxAttempts) {
          // Block user
          const blockedUntil = new Date(now.getTime() + config.blockDurationMs);
          await supabase
            .from('rate_limits')
            .update({
              attempt_count: newCount,
              last_attempt: now.toISOString(),
              blocked_until: blockedUntil.toISOString(),
            })
            .eq('id', existing.id);

          return { allowed: false, blockedUntil };
        }

        // Update attempt count
        await supabase
          .from('rate_limits')
          .update({
            attempt_count: newCount,
            last_attempt: now.toISOString(),
          })
          .eq('id', existing.id);

        return {
          allowed: true,
          remainingAttempts: config.maxAttempts - newCount,
        };
      } else {
        // Outside window, reset count
        await supabase
          .from('rate_limits')
          .update({
            attempt_count: 1,
            last_attempt: now.toISOString(),
            blocked_until: null,
          })
          .eq('id', existing.id);

        return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
      }
    } else {
      // First attempt, create record
      await supabase.from('rate_limits').insert({
        user_id: userId,
        ip_address: ipAddress,
        action,
        attempt_count: 1,
        last_attempt: now.toISOString(),
      });

      return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
    }
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request
    return { allowed: true };
  }
};
