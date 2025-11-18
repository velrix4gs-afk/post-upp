import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { offlineStorage } from '@/lib/offlineStorage';
import { messageQueue } from '@/lib/messageQueue';

export const useOfflineMessages = (chatId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const loadMessages = async () => {
      // Try local cache first
      const cached = offlineStorage.get<any[]>(`messages_${chatId}`);
      if (cached) {
        setMessages(cached);
      }

      // If online, fetch fresh data
      if (isOnline && user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles!sender_id(*)')
            .eq('chat_id', chatId)
            .order('created_at', { ascending: true });

          if (!error && data) {
            setMessages(data);
            offlineStorage.set(`messages_${chatId}`, data);
          }
        } catch (error) {
          // If fetch fails, use cached data
        } finally {
          setLoading(false);
        }
      }
    };

    loadMessages();

    // Subscribe to real-time updates only when online
    if (isOnline) {
      const channel = supabase
        .channel(`messages:${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          const updated = [...messages, payload.new];
          offlineStorage.set(`messages_${chatId}`, updated);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatId, isOnline, user]);

  const sendMessage = async (content: string, mediaUrl?: string, replyTo?: string) => {
    if (!chatId || !user) return;

    const tempId = `temp_${Date.now()}`;
    const tempMessage = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content,
      media_url: mediaUrl,
      reply_to: replyTo,
      created_at: new Date().toISOString(),
      status: 'sending',
      sender: { id: user.id, display_name: 'You' }
    };

    // Optimistically add to UI
    setMessages(prev => [...prev, tempMessage]);

    try {
      if (isOnline) {
        const { error } = await supabase.from('messages').insert({
          chat_id: chatId,
          sender_id: user.id,
          content,
          media_url: mediaUrl,
          reply_to: replyTo
        });

        if (error) throw error;
      } else {
        // Add to queue for later
        await messageQueue.addToQueue({
          tempId,
          chatId,
          content,
          mediaUrl,
          replyTo
        });
      }
    } catch (error) {
      // Queue for retry
      await messageQueue.addToQueue({
        tempId,
        chatId,
        content,
        mediaUrl,
        replyTo
      });
    }
  };

  return { messages, loading, sendMessage, isOnline };
};
