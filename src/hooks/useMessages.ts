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
  updated_at?: string;
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
  created_by?: string;
  created_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    role: string;
    joined_at: string;
    profiles: {
      username?: string;
      display_name?: string;
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
          
          // Skip if this is an optimistic message we already have
          if (newMessage.sender_id === user?.id) {
            const exists = messages.find(m => m.content === newMessage.content && m.sender_id === user.id);
            if (exists && exists.is_optimistic) {
              // Replace optimistic with real
              setMessages(prev => prev.map(m => 
                m.is_optimistic && m.content === newMessage.content && m.sender_id === user.id
                  ? { ...newMessage, sender: m.sender, status: 'sent' as const, updated_at: newMessage.created_at }
                  : m
              ));
              return;
            }
          }
          
          // Fetch sender profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();
          
          const messageWithProfile: Message = {
            ...newMessage,
            status: 'sent' as const,
            updated_at: newMessage.created_at,
            sender: {
              username: profile?.username || 'user',
              display_name: profile?.display_name || 'User',
              avatar_url: profile?.avatar_url
            }
          };
          
          setMessages(prev => {
            // Avoid duplicates
            const exists = prev.find(m => m.id === messageWithProfile.id);
            if (exists) return prev;
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
            status: (updatedMessage.status || 'sent') as 'sending' | 'sent' | 'delivered' | 'read' | 'failed',
            updated_at: updatedMessage.edited_at || updatedMessage.created_at,
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
  }, [chatId, user]);

  const fetchChats = async () => {
    try {
      // Get chats where user is a participant
      const { data: participantChats, error } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user!.id);

      if (error) throw error;

      const chatIds = participantChats?.map(p => p.chat_id) || [];
      
      if (chatIds.length === 0) {
        setChats([]);
        return;
      }

      // Get chat details
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Get participants for each chat with profiles
      const chatsWithParticipants: Chat[] = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select('user_id, role, joined_at')
            .eq('chat_id', chat.id);

          // Fetch profiles for participants
          const participantsWithProfiles = await Promise.all(
            (participants || []).map(async (p) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, display_name, avatar_url')
                .eq('id', p.user_id)
                .single();

              return {
                user_id: p.user_id,
                role: p.role,
                joined_at: p.joined_at,
                profiles: {
                  username: profile?.username || '',
                  display_name: profile?.display_name || '',
                  avatar_url: profile?.avatar_url
                }
              };
            })
          );

          return {
            id: chat.id,
            name: chat.name,
            avatar_url: chat.avatar_url,
            is_group: chat.type === 'group',
            created_by: chat.created_by,
            created_at: chat.created_at,
            updated_at: chat.updated_at,
            participants: participantsWithProfiles
          };
        })
      );

      setChats(chatsWithParticipants);
    } catch (err: any) {
      console.error('[CHAT_001] Failed to load chats:', err);
    }
  };

  const fetchMessages = async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      
      // Fetch messages
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles and reply_to messages
      const messagesWithProfiles: Message[] = await Promise.all(
        (messagesData || []).map(async (msg) => {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          let reply_to_message = undefined;
          if (msg.reply_to) {
            const { data: replyMsg } = await supabase
              .from('messages')
              .select('id, content')
              .eq('id', msg.reply_to)
              .single();

            if (replyMsg) {
              const { data: replySenderProfile } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', msg.sender_id)
                .single();

              reply_to_message = {
                id: replyMsg.id,
                content: replyMsg.content,
                sender: {
                  display_name: replySenderProfile?.display_name || 'User'
                }
              };
            }
          }

          return {
            ...msg,
            status: (msg.status || 'sent') as 'sending' | 'sent' | 'delivered' | 'read' | 'failed',
            sender: {
              username: senderProfile?.username || 'user',
              display_name: senderProfile?.display_name || 'User',
              avatar_url: senderProfile?.avatar_url
            },
            reply_to_message
          };
        })
      );

      setMessages(messagesWithProfiles);
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
      // Insert message into database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: content.trim() || null,
          media_url: mediaUrl || null,
          media_type: mediaType || null,
          reply_to: replyTo || null,
          status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch sender profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', user.id)
        .single();
      
      // Update status to sent
      localStorage.setItem(messageStatusKey, 'sent');
      
      // Replace optimistic message with real message
      const realMessage: Message = {
        ...data,
        status: 'sent' as const,
        updated_at: data.created_at,
        sender: {
          username: senderProfile?.username || 'user',
          display_name: senderProfile?.display_name || 'User',
          avatar_url: senderProfile?.avatar_url
        }
      };

      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? realMessage : msg
      ));
      
      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);
      
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
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          content: content.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      // Fetch sender profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('id', data.sender_id)
        .single();
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? {
              ...data,
              status: (data.status || 'sent') as 'sending' | 'sent' | 'delivered' | 'read' | 'failed',
              updated_at: data.edited_at || data.created_at,
              sender: {
                username: senderProfile?.username || 'user',
                display_name: senderProfile?.display_name || 'User',
                avatar_url: senderProfile?.avatar_url
              }
            }
          : msg
      ));
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
      if (deleteFor === 'everyone') {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId);

        if (error) throw error;
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      } else {
        // Delete for me - add user ID to deleted_for array
        const { data: message } = await supabase
          .from('messages')
          .select('deleted_for')
          .eq('id', messageId)
          .single();

        const deletedFor = message?.deleted_for || [];
        if (!deletedFor.includes(user!.id)) {
          deletedFor.push(user!.id);
        }

        const { error } = await supabase
          .from('messages')
          .update({ deleted_for: deletedFor })
          .eq('id', messageId);

        if (error) throw error;
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
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
      // Check if reaction exists
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (existing) {
        // Update existing reaction
        const { error } = await supabase
          .from('message_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new reaction
        const { error } = await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user!.id,
            reaction_type: reactionType
          });

        if (error) throw error;
      }
    } catch (err: any) {
      console.error('React to message error:', err);
    }
  };

  const unreactToMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user!.id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Unreact to message error:', err);
    }
  };

  const starMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('starred_messages')
        .insert({ 
          user_id: user!.id, 
          message_id: messageId 
        });

      if (error && error.code === '23505') {
        // Already starred, ignore
        return;
      }
      
      if (error) throw error;
    } catch (err: any) {
      console.error('Star message error:', err);
    }
  };

  const unstarMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('starred_messages')
        .delete()
        .eq('user_id', user!.id)
        .eq('message_id', messageId);

      if (error) throw error;
    } catch (err: any) {
      console.error('Unstar message error:', err);
    }
  };

  const forwardMessage = async (messageId: string, toChatIds: string[]) => {
    try {
      // Get original message
      const { data: originalMessage, error: fetchError } = await supabase
        .from('messages')
        .select('content, media_url, media_type')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Create forwarded messages
      const forwardedMessages = toChatIds.map(chatId => ({
        chat_id: chatId,
        sender_id: user!.id,
        content: originalMessage.content,
        media_url: originalMessage.media_url,
        media_type: originalMessage.media_type,
        is_forwarded: true,
        forwarded_from_message_id: messageId,
        status: 'sent'
      }));

      const { error } = await supabase
        .from('messages')
        .insert(forwardedMessages);

      if (error) throw error;
    } catch (err: any) {
      console.error('Forward message error:', err);
    }
  };

  const markMessageRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('message_reads')
        .insert({ 
          message_id: messageId, 
          user_id: user!.id 
        });

      if (error && error.code === '23505') {
        // Already marked as read, ignore
        return;
      }

      if (error) throw error;
    } catch (err: any) {
      console.error('Mark message read error:', err);
    }
  };

  const refetchChats = () => {
    fetchChats();
  };

  const refetchMessages = () => {
    if (chatId) fetchMessages();
  };

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
    refetchChats,
    refetchMessages
  };
};
