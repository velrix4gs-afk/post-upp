import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const usePresenceSystem = (chatId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [presenceChannel, setPresenceChannel] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create presence channel using Supabase Realtime
    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track presence state changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences && presences.length > 0) {
            presences.forEach((presence: any) => {
              if (presence.user_id && presence.status === 'online') {
                online.add(presence.user_id);
              }
            });
          }
        });
        
        setOnlineUsers(online);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (newPresences && Array.isArray(newPresences)) {
            newPresences.forEach((presence: any) => {
              if (presence.user_id && presence.status === 'online') {
                updated.add(presence.user_id);
              }
            });
          }
          return updated;
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (leftPresences && Array.isArray(leftPresences)) {
            leftPresences.forEach((presence: any) => {
              if (presence.user_id) {
                updated.delete(presence.user_id);
              }
            });
          }
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            status: 'online',
          });
        }
      });

    setPresenceChannel(channel);

    // Heartbeat to keep presence alive
    const heartbeatInterval = setInterval(async () => {
      if (channel) {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
          status: 'online',
        });
      }
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const updateCurrentChat = async (newChatId?: string) => {
    if (!user || !presenceChannel) return;
    
    // Update presence with current chat info
    await presenceChannel.track({
      user_id: user.id,
      online_at: new Date().toISOString(),
      status: 'online',
      current_chat_id: newChatId,
    });
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const isUserInChat = (userId: string, checkChatId: string) => {
    // This would require tracking chat info in presence state
    return false;
  };

  return {
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,
    isUserInChat,
    updateCurrentChat
  };
};
