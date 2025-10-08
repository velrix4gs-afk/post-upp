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
        }, (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [chatId]);

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('messages', {
        body: { action: 'list_chats' },
      });

      if (error) throw error;
      
      setChats(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load chats',
        variant: 'destructive'
      });
    }
  };

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('messages', {
        body: { chat_id: chatId },
      });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive'
      });
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

    try {
      const { data, error } = await supabase.functions.invoke('messages', {
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
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...data, status: 'sent' as const }
          : msg
      ));
    } catch (err: any) {
      console.error('Send message error:', err);
      
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
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!content.trim()) return;

    try {
      const { data, error } = await supabase.functions.invoke('messages', {
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

      toast({
        title: 'Success',
        description: 'Message edited'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to edit message',
        variant: 'destructive'
      });
    }
  };

  const deleteMessage = async (messageId: string, deleteFor: 'me' | 'everyone' = 'me') => {
    try {
      const { data, error } = await supabase.functions.invoke('messages', {
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
        // For "delete for me", just remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }

      toast({
        title: 'Success',
        description: 'Message deleted'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  const reactToMessage = async (messageId: string, reactionType: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages', {
        body: {
          action: 'react',
          messageId,
          reactionType
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Reaction added'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive'
      });
    }
  };

  const unreactToMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages', {
        body: {
          action: 'unreact',
          messageId
        },
      });

      if (error) throw error;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove reaction',
        variant: 'destructive'
      });
    }
  };

  const starMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages', {
        body: {
          action: 'star',
          messageId
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Message starred'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to star message',
        variant: 'destructive'
      });
    }
  };

  const unstarMessage = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages', {
        body: {
          action: 'unstar',
          messageId
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Message unstarred'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to unstar message',
        variant: 'destructive'
      });
    }
  };

  const forwardMessage = async (messageId: string, toChatIds: string[]) => {
    try {
      const { error } = await supabase.functions.invoke('messages', {
        body: {
          action: 'forward',
          messageId,
          toChatIds
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Message forwarded to ${toChatIds.length} chat(s)`
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to forward message',
        variant: 'destructive'
      });
    }
  };

  const markMessageRead = async (messageId: string) => {
    try {
      await supabase.functions.invoke('messages', {
        body: {
          action: 'mark_read',
          messageId
        },
      });
    } catch (err: any) {
      console.error('Error marking message as read:', err);
    }
  };

  const createChat = async (participantIds: string[], isGroup = false, name?: string) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check if private chat already exists
      if (!isGroup && participantIds.length === 1) {
        const { data: myChats } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (myChats && myChats.length > 0) {
          for (const myChat of myChats) {
            const { data: participants } = await supabase
              .from('chat_participants')
              .select('user_id, chats!inner(type)')
              .eq('chat_id', myChat.chat_id);

            if (participants && participants.length === 2) {
              const chat = participants[0].chats as any;
              if (chat.type === 'private') {
                const otherUserId = participants.find(p => p.user_id !== user.id)?.user_id;
                if (otherUserId === participantIds[0]) {
                  await fetchChats();
                  return myChat.chat_id;
                }
              }
            }
          }
        }
      }

      // Create new chat via Supabase client with service role
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          name: name || null,
          type: isGroup ? 'group' : 'private',
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Chat creation error:', chatError);
        throw new Error(`Failed to create chat: ${chatError.message}`);
      }

      // Add current user as admin
      const { error: adminError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
          role: 'admin'
        });

      if (adminError) {
        console.error('Admin participant error:', adminError);
        throw new Error(`Failed to add admin: ${adminError.message}`);
      }

      // Add other participants
      if (participantIds.length > 0) {
        const { error: participantsError } = await supabase
          .from('chat_participants')
          .insert(
            participantIds.map(id => ({
              chat_id: chat.id,
              user_id: id,
              role: 'member'
            }))
          );

        if (participantsError) {
          console.error('Other participants error:', participantsError);
          throw new Error(`Failed to add participants: ${participantsError.message}`);
        }
      }

      await fetchChats();
      
      toast({
        title: 'Success',
        description: 'Chat created successfully'
      });

      return chat.id;
    } catch (err: any) {
      console.error('Create chat error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create chat',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  return {
    messages,
    chats,
    loading,
    sendMessage,
    editMessage,
    deleteMessage,
    createChat,
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