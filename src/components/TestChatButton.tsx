import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

interface TestChatButtonProps {
  onChatCreated?: (chatId: string) => void;
}

export const TestChatButton = ({ onChatCreated }: TestChatButtonProps) => {
  const { user } = useAuth();

  const createTestChat = async () => {
    if (!user) return;

    try {
      // Get a random other user to create a test chat with
      const { data: otherUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .neq('id', user.id)
        .limit(1);

      if (usersError) throw usersError;
      if (!otherUsers || otherUsers.length === 0) {
        toast({
          title: 'No other users',
          description: 'Need at least 2 users to create a chat',
          variant: 'destructive'
        });
        return;
      }

      const otherUserId = otherUsers[0].id;

      // Create chat
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          type: 'private'
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chat.id, user_id: user.id, role: 'admin' },
          { chat_id: chat.id, user_id: otherUserId, role: 'member' }
        ]);

      if (participantsError) throw participantsError;

      toast({
        title: 'Success',
        description: 'Test chat created!'
      });

      onChatCreated?.(chat.id);
    } catch (error: any) {
      console.error('Test chat creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test chat',
        variant: 'destructive'
      });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={createTestChat}
      className="gap-2"
    >
      <MessageSquare className="h-4 w-4" />
      Create Test Chat
    </Button>
  );
};
