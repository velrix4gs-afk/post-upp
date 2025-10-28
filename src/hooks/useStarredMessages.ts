import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useStarredMessages = (chatId?: string) => {
  const { user } = useAuth();
  const [starredMessages, setStarredMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && chatId) {
      fetchStarredMessages();
    }
  }, [user, chatId]);

  const fetchStarredMessages = async () => {
    if (!user || !chatId) return;

    try {
      // First get all message IDs for this chat
      const { data: chatMessages } = await supabase
        .from('messages')
        .select('id')
        .eq('chat_id', chatId);

      if (!chatMessages || chatMessages.length === 0) {
        setStarredMessages([]);
        setLoading(false);
        return;
      }

      const messageIds = chatMessages.map(m => m.id);

      // Then get starred messages for these IDs
      const { data, error } = await supabase
        .from('starred_messages')
        .select('message_id')
        .eq('user_id', user.id)
        .in('message_id', messageIds);

      if (error) throw error;

      setStarredMessages(data?.map(m => m.message_id) || []);
    } catch (error) {
      console.error('Error fetching starred messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const starMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('starred_messages')
        .insert({
          message_id: messageId,
          user_id: user.id,
        });

      if (error) throw error;

      setStarredMessages([...starredMessages, messageId]);
      toast({ title: 'Message starred' });
    } catch (error) {
      console.error('Error starring message:', error);
      toast({ title: 'Failed to star message', variant: 'destructive' });
    }
  };

  const unstarMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('starred_messages')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;

      setStarredMessages(starredMessages.filter(id => id !== messageId));
      toast({ title: 'Message unstarred' });
    } catch (error) {
      console.error('Error unstarring message:', error);
      toast({ title: 'Failed to unstar message', variant: 'destructive' });
    }
  };

  const isStarred = (messageId: string) => starredMessages.includes(messageId);

  return {
    starredMessages,
    loading,
    starMessage,
    unstarMessage,
    isStarred,
    refetch: fetchStarredMessages,
  };
};
