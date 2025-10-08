import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TypingIndicatorProps {
  chatId: string;
}

interface TypingEvent {
  user_id: string;
  display_name: string;
  is_typing: boolean;
}

const TypingIndicator = ({ chatId }: TypingIndicatorProps) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId || !user) return;

    // Subscribe to typing broadcast events
    const channel = supabase
      .channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const event = payload.payload as TypingEvent;
        
        if (event.user_id !== user.id) {
          if (event.is_typing) {
            setTypingUsers(prev => [...new Set([...prev, event.display_name])]);
          } else {
            setTypingUsers(prev => prev.filter(name => name !== event.display_name));
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        {typingUsers.length === 1 
          ? `${typingUsers[0]} is typing` 
          : `${typingUsers.slice(0, 2).join(', ')}${typingUsers.length > 2 ? ' and others' : ''} are typing`}
        <span className="inline-flex gap-1 ml-1">
          <span className="animate-bounce delay-0">.</span>
          <span className="animate-bounce delay-100">.</span>
          <span className="animate-bounce delay-200">.</span>
        </span>
      </span>
    </div>
  );
};

export default TypingIndicator;
