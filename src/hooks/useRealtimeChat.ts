import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TypingEvent {
  user_id: string;
  display_name: string;
  is_typing: boolean;
}

interface ReadReceiptEvent {
  message_id: string;
  user_id: string;
  read_at: string;
}

interface RealtimeChatCallbacks {
  onTyping?: (event: TypingEvent) => void;
  onReadReceipt?: (event: ReadReceiptEvent) => void;
}

export const useRealtimeChat = (chatId: string | undefined, callbacks: RealtimeChatCallbacks = {}) => {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!chatId || !user) return;

    const channel = supabase.channel(`chat:${chatId}`);

    // Listen for typing events
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.user_id !== user.id) {
        callbacks.onTyping?.(payload.payload as TypingEvent);
      }
    });

    // Listen for read receipts
    channel.on('broadcast', { event: 'read_receipt' }, (payload) => {
      if (payload.payload.user_id !== user.id) {
        callbacks.onReadReceipt?.(payload.payload as ReadReceiptEvent);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [chatId, user]);

  const broadcastTyping = async (isTyping: boolean) => {
    if (!channelRef.current || !user) return;

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

  const broadcastReadReceipt = async (messageId: string) => {
    if (!channelRef.current || !user) return;

    await channelRef.current.send({
      type: 'broadcast',
      event: 'read_receipt',
      payload: {
        message_id: messageId,
        user_id: user.id,
        read_at: new Date().toISOString(),
      },
    });
  };

  return {
    handleTyping,
    broadcastReadReceipt,
    broadcastTyping,
  };
};
