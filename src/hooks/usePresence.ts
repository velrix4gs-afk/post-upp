import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPresence {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  online_at: string;
  viewing_chat?: string;
}

export const usePresence = (chatId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresence>>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<UserPresence>();
        const users: Record<string, UserPresence> = {};
        
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            users[presence.user_id] = presence;
          });
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('User left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', user.id)
            .single();

          await presenceChannel.track({
            user_id: user.id,
            display_name: profile?.display_name || 'User',
            avatar_url: profile?.avatar_url,
            online_at: new Date().toISOString(),
            viewing_chat: chatId,
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [user, chatId]);

  const updateViewingChat = async (newChatId?: string) => {
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
      viewing_chat: newChatId,
    });
  };

  const isUserOnline = (userId: string) => {
    return !!onlineUsers[userId];
  };

  const isUserViewingChat = (userId: string, checkChatId: string) => {
    return onlineUsers[userId]?.viewing_chat === checkChatId;
  };

  return {
    onlineUsers,
    isUserOnline,
    isUserViewingChat,
    updateViewingChat,
  };
};
