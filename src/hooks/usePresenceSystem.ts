import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserPresenceData {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  current_chat_id?: string;
  updated_at: string;
}

export const usePresenceSystem = (chatId?: string) => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, UserPresenceData>>({});

  useEffect(() => {
    if (!user) return;

    // Set user as online when component mounts
    const setOnline = async () => {
      await supabase
        .from('user_presence' as any)
        .upsert({
          user_id: user.id,
          status: 'online',
          current_chat_id: chatId,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    };

    setOnline();

    // Subscribe to presence changes
    const presenceChannel = supabase
      .channel('user-presence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const presence = payload.new as UserPresenceData;
            setOnlineUsers(prev => ({
              ...prev,
              [presence.user_id]: presence
            }));
          } else if (payload.eventType === 'DELETE') {
            const presence = payload.old as UserPresenceData;
            setOnlineUsers(prev => {
              const newState = { ...prev };
              delete newState[presence.user_id];
              return newState;
            });
          }
        }
      )
      .subscribe();

    // Fetch initial presence data
    const fetchPresence = async () => {
      const { data } = await supabase
        .from('user_presence' as any)
        .select('*')
        .eq('status', 'online');

      if (data) {
        const presenceMap: Record<string, UserPresenceData> = {};
        data.forEach((p: any) => {
          presenceMap[p.user_id] = p;
        });
        setOnlineUsers(presenceMap);
      }
    };

    fetchPresence();

    // Update presence every 30 seconds
    const intervalId = setInterval(async () => {
      await supabase
        .from('user_presence' as any)
        .upsert({
          user_id: user.id,
          status: 'online',
          current_chat_id: chatId,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    }, 30000);

    // Set user as offline when component unmounts
    return () => {
      clearInterval(intervalId);
      supabase
        .from('user_presence' as any)
        .upsert({
          user_id: user.id,
          status: 'offline',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      supabase.removeChannel(presenceChannel);
    };
  }, [user, chatId]);

  const updateCurrentChat = async (newChatId?: string) => {
    if (!user) return;
    
    await supabase
      .from('user_presence' as any)
      .upsert({
        user_id: user.id,
        status: 'online',
        current_chat_id: newChatId,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers[userId]?.status === 'online';
  };

  const isUserInChat = (userId: string, checkChatId: string) => {
    return onlineUsers[userId]?.current_chat_id === checkChatId;
  };

  return {
    onlineUsers,
    isUserOnline,
    isUserInChat,
    updateCurrentChat
  };
};
