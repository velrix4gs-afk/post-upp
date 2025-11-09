import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePresenceSystem = (currentChatId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel('online-users');

    // Set self as online
    const setOnline = async () => {
      await supabase
        .from('profiles')
        .update({ 
          is_online: true, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', user.id);
    };

    // Get profile data
    const getProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    };

    // Track presence
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id) users.add(presence.user_id);
          });
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await setOnline();
          const profile = await getProfile();
          await presenceChannel.track({
            user_id: user.id,
            display_name: profile?.display_name || 'User',
            avatar_url: profile?.avatar_url,
            online_at: new Date().toISOString(),
            viewing_chat: currentChatId
          });
        }
      });

    setChannel(presenceChannel);

    // Update last seen every minute
    const interval = setInterval(async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', user.id);
    }, 60000);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      supabase
        .from('profiles')
        .update({ 
          is_online: false, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', user.id);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, currentChatId]);

  const isUserOnline = (userId: string) => onlineUsers.has(userId);

  const updateCurrentChat = async (newChatId?: string) => {
    if (!channel || !user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', user.id)
      .single();

    await channel.track({
      user_id: user.id,
      display_name: profile?.display_name || 'User',
      avatar_url: profile?.avatar_url,
      online_at: new Date().toISOString(),
      viewing_chat: newChatId
    });
  };

  return { onlineUsers, isUserOnline, updateCurrentChat };
};
