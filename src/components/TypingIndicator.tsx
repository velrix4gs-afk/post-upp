import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TypingIndicatorProps {
  chatId: string;
}

const TypingIndicator = ({ chatId }: TypingIndicatorProps) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!chatId || !user) return;

    // Subscribe to typing status changes
    const channel = supabase
      .channel(`typing:${chatId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_status',
        filter: `chat_id=eq.${chatId}`
      }, async (payload: any) => {
        if (payload.new && payload.new.user_id !== user.id) {
          if (payload.new.is_typing) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', payload.new.user_id)
              .single();

            if (profile) {
              setTypingUsers(prev => [...new Set([...prev, profile.display_name])]);
            }
          } else {
            // Fetch user profile to remove
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', payload.new.user_id)
              .single();

            if (profile) {
              setTypingUsers(prev => prev.filter(name => name !== profile.display_name));
            }
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
