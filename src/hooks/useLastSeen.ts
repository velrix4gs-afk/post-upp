import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LastSeenData {
  user_id: string;
  last_seen: string;
  is_online: boolean;
}

export const useLastSeen = (userId?: string) => {
  const [lastSeen, setLastSeen] = useState<LastSeenData | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchLastSeen = async () => {
      // Check online presence first
      const presenceKey = `presence:${userId}`;
      const cached = localStorage.getItem(presenceKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 60000) { // 1 min cache
          setLastSeen({
            user_id: userId,
            last_seen: data.last_seen,
            is_online: data.is_online
          });
          return;
        }
      }

      // Fallback: estimate from recent activity
      const { data: recentMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const lastSeenTime = recentMessage?.created_at || new Date().toISOString();
      
      setLastSeen({
        user_id: userId,
        last_seen: lastSeenTime,
        is_online: false
      });
    };

    fetchLastSeen();

    // Subscribe to presence updates
    const channel = supabase.channel(`last-seen:${userId}`)
      .on('presence', { event: 'sync' }, () => {
        fetchLastSeen();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const formatLastSeen = (): string => {
    if (!lastSeen) return 'Last seen recently';
    if (lastSeen.is_online) return 'Online';

    const lastSeenDate = new Date(lastSeen.last_seen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Last seen just now';
    if (diffMins < 60) return `Last seen ${diffMins} minutes ago`;
    if (diffHours < 24) return `Last seen ${diffHours} hours ago`;
    if (diffDays === 1) return 'Last seen yesterday';
    if (diffDays < 7) return `Last seen ${diffDays} days ago`;
    return `Last seen ${lastSeenDate.toLocaleDateString()}`;
  };

  return {
    lastSeen,
    formatLastSeen,
    isOnline: lastSeen?.is_online || false
  };
};
