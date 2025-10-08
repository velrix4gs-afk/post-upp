import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useTypingIndicator = (chatId: string | undefined) => {
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const setTyping = async (isTyping: boolean) => {
    if (!chatId || !user) return;

    try {
      if (isTyping) {
        // Upsert typing status
        await supabase
          .from('typing_status')
          .upsert({
            chat_id: chatId,
            user_id: user.id,
            is_typing: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'chat_id,user_id'
          });
      } else {
        // Remove typing status
        await supabase
          .from('typing_status')
          .update({ is_typing: false })
          .eq('chat_id', chatId)
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setTyping(false);
    };
  }, [chatId]);

  return { handleTyping, setTyping };
};
