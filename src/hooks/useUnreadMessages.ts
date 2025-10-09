import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUnreadMessages = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`unread_messages:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        // Only refetch if the message is not from the current user
        if (payload.new && (payload.new as any).sender_id !== user.id) {
          fetchUnreadCount();
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'message_reads',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First, get all chats where user is a participant
      const { data: userChats, error: chatsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (chatsError) throw chatsError;

      if (!userChats || userChats.length === 0) {
        setUnreadCount(0);
        return;
      }

      const chatIds = userChats.map(c => c.chat_id);

      // Get all messages in these chats from other users
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .in('chat_id', chatIds)
        .neq('sender_id', user.id);

      if (messagesError) throw messagesError;

      if (!messages || messages.length === 0) {
        setUnreadCount(0);
        return;
      }

      const messageIds = messages.map(m => m.id);

      // Get all read messages by this user
      const { data: readMessages, error: readError } = await supabase
        .from('message_reads')
        .select('message_id')
        .eq('user_id', user.id)
        .in('message_id', messageIds);

      if (readError) throw readError;

      const readMessageIds = new Set(readMessages?.map(r => r.message_id) || []);
      const unreadMessages = messages.filter(m => !readMessageIds.has(m.id));

      setUnreadCount(unreadMessages.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { unreadCount, loading, refetch: fetchUnreadCount };
};
