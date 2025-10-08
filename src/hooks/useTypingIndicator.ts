import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

export const useTypingIndicator = (chatId: string | undefined) => {
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`typing:${chatId}`);
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      broadcastTyping(false);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [chatId, user]);

  const broadcastTyping = async (isTyping: boolean) => {
    if (!channelRef.current || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      await channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          display_name: profile?.display_name || 'User',
          is_typing: isTyping,
        },
      });
    } catch (error) {
      console.error('Error broadcasting typing status:', error);
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    broadcastTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 3000);
  };

  return { handleTyping };
};
