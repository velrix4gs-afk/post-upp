import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface ScheduledMessage {
  id: string;
  chat_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  scheduled_for: string;
  sent: boolean;
}

export const useScheduledMessages = (chatId?: string) => {
  const { user } = useAuth();
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && chatId) {
      fetchScheduledMessages();
    }
  }, [user, chatId]);

  const fetchScheduledMessages = async () => {
    if (!user || !chatId) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('sender_id', user.id)
        .eq('sent', false)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;

      setScheduledMessages(data || []);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleMessage = async (
    content: string,
    scheduledFor: Date,
    mediaUrl?: string,
    mediaType?: string
  ) => {
    if (!user || !chatId) return;

    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content,
          scheduled_for: scheduledFor.toISOString(),
          media_url: mediaUrl,
          media_type: mediaType,
        });

      if (error) throw error;

      await fetchScheduledMessages();
      toast({ title: 'Message scheduled' });
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast({ title: 'Failed to schedule message', variant: 'destructive' });
    }
  };

  const deleteScheduledMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setScheduledMessages(scheduledMessages.filter(m => m.id !== messageId));
      toast({ title: 'Scheduled message deleted' });
    } catch (error) {
      console.error('Error deleting scheduled message:', error);
      toast({ title: 'Failed to delete scheduled message', variant: 'destructive' });
    }
  };

  return {
    scheduledMessages,
    loading,
    scheduleMessage,
    deleteScheduledMessage,
    refetch: fetchScheduledMessages,
  };
};
