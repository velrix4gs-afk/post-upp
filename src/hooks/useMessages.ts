import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  reply_to?: string;
  is_edited: boolean;
  is_forwarded?: boolean;
  created_at: string;
  updated_at: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  is_optimistic?: boolean;
  sender: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  reply_to_message?: {
    id: string;
    content?: string;
    sender: {
      display_name: string;
    };
  };
}

export interface Chat {
  id: string;
  name?: string;
  avatar_url?: string;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    role: string;
    joined_at: string;
    profiles: {
      username: string;
      display_name: string;
      avatar_url?: string;
    };
  }[];
}

export const useMessages = (chatId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();

      // Set up real-time subscription for chats
      const chatsChannel = supabase
        .channel('chats-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chats'
          },
          () => {
            fetchChats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_participants',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchChats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(chatsChannel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
      
      // Set up real-time subscription for messages
      const channel = supabase
        .channel(`messages:${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch sender profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();
          
          const messageWithProfile: Message = {
            ...newMessage,
            sender: {
              username: profile?.username || 'user',
              display_name: profile?.display_name || 'User',
              avatar_url: profile?.avatar_url
            }
          };
          
          setMessages(prev => {
            // Avoid duplicates (optimistic updates)
            const exists = prev.find(m => m.id === messageWithProfile.id);
            if (exists) {
              return prev.map(m => m.id === messageWithProfile.id ? messageWithProfile : m);
            }
            return [...prev, messageWithProfile];
          });
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, async (payload) => {
          const updatedMessage = payload.new as any;
          
          // Fetch sender profile for updated message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', updatedMessage.sender_id)
            .single();
          
          const messageWithProfile: Message = {
            ...updatedMessage,
            sender: {
              username: profile?.username || 'user',
              display_name: profile?.display_name || 'User',
              avatar_url: profile?.avatar_url
            }
          };
          
          setMessages(prev => prev.map(msg => 
            msg.id === messageWithProfile.id ? messageWithProfile : msg
          ));
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatId]);

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('messages-v2', {
        body: { action: 'list_chats' },
      });

      if (error) throw error;
      
      setChats(data || []);
    } catch (err: any) {
      console.error('[CHAT_001] Failed to load chats:', err);
    }
  };

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('messages-v2', {
        body: { chat_id: chatId },
      });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      console.error('[MSG_001] Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, replyTo?: string, mediaUrl?: string, mediaType?: string) => {
    if (!chatId || (!content.trim() && !mediaUrl) || !user) return;

    // Generate temporary ID for optimistic update
    const tempId = `temp-${crypto.randomUUID()}`;
    
    // Create optimistic message
    const optimisticMessage: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim() || undefined,
      media_url: mediaUrl,
      media_type: mediaType,
      reply_to: replyTo,
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sending',
      is_optimistic: true,
      sender: {
        username: user.user_metadata?.username || 'user',
        display_name: user.user_metadata?.display_name || 'User',
        avatar_url: user.user_metadata?.avatar_url,
      },
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Persist status in localStorage
    const messageStatusKey = `msg_status_${tempId}`;
    localStorage.setItem(messageStatusKey, 'sending');

    try {
      const { data, error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'send',
          chat_id: chatId,
          content: content.trim() || undefined,
          reply_to: replyTo,
          media_url: mediaUrl,
          media_type: mediaType
        },
      });

      if (error) throw error;
      
      // Update status to sent
      localStorage.setItem(messageStatusKey, 'sent');
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...data, status: 'sent' as const }
          : msg
      ));
      
      // Clean up status after 3 seconds
      setTimeout(() => {
        localStorage.removeItem(messageStatusKey);
      }, 3000);
    } catch (err: any) {
      console.error('Send message error:', err);
      
      // Update status to failed
      localStorage.setItem(messageStatusKey, 'failed');
      
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'failed' as const }
          : msg
      ));
      
      toast({
        title: 'Error',
        description: err.message || 'Failed to send message',
        variant: 'destructive'
      });
      
      // Keep failed status for 30 seconds
      setTimeout(() => {
        localStorage.removeItem(messageStatusKey);
      }, 30000);
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!content.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'edit',
          messageId,
          content: content.trim()
        },
      });

      if (error) throw error;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? data : msg
      ));
    } catch (err: any) {
      toast({
        title: 'MSG_002',
        description: 'Failed to edit message',
        variant: 'destructive'
      });
    }
  };

  const deleteMessage = async (messageId: string, deleteFor: 'me' | 'everyone' = 'me') => {
    try {
      const { data, error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'delete',
          messageId,
          deleteFor
        },
      });

      if (error) throw error;
      
      if (deleteFor === 'everyone') {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (err: any) {
      toast({
        title: 'MSG_003',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  const reactToMessage = async (messageId: string, reactionType: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'react',
          messageId,
          reactionType
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'MSG_004',
        description: 'Failed to add reaction',
        variant: 'destructive'
      });
    }
  };

  const unreactToMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'unreact',
          messageId
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'MSG_005',
        description: 'Failed to remove reaction',
        variant: 'destructive'
      });
    }
  };

  const starMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'star',
          messageId
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'MSG_006',
        description: 'Failed to star message',
        variant: 'destructive'
      });
    }
  };

  const unstarMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'unstar',
          messageId
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'MSG_007',
        description: 'Failed to unstar message',
        variant: 'destructive'
      });
    }
  };

  const forwardMessage = async (messageId: string, toChatIds: string[]) => {
    try {
      const { error } = await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'forward',
          messageId,
          toChatIds
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'MSG_008',
        description: 'Failed to forward message',
        variant: 'destructive'
      });
    }
  };

  const markMessageRead = async (messageId: string) => {
    try {
      await supabase.functions.invoke('messages-v2', {
        body: {
          action: 'mark_read',
          messageId
        },
      });
    } catch (err: any) {
      console.error('Error marking message as read:', err);
    }
  };

  // NOTE: Chat creation removed from useMessages hook
  // All chat creation should use the useChats hook instead
  // This ensures consistent UUID-based chat creation via the friendships edge function

  return {
    messages,
    chats,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    unreactToMessage,
    starMessage,
    unstarMessage,
    forwardMessage,
    markMessageRead,
    refetchChats: fetchChats,
    refetchMessages: fetchMessages
  };
};