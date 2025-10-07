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
      // First get chats where user is a participant
      const { data: participantChats, error: participantError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user?.id);

      if (participantError) throw participantError;

      const chatIds = participantChats?.map(p => p.chat_id) || [];
      
      if (chatIds.length === 0) {
        setChats([]);
        return;
      }

      // Fetch full chat details with participants
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          name,
          avatar_url,
          type,
          created_at
        `)
        .in('id', chatIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch participants for each chat
      const chatsWithParticipants = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: participants } = await supabase
            .from('chat_participants')
            .select(`
              user_id,
              role,
              joined_at,
              profiles:user_id (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('chat_id', chat.id);

          return {
            ...chat,
            is_group: chat.type === 'group',
            created_by: '',
            updated_at: chat.created_at,
            participants: participants?.map(p => ({
              user_id: p.user_id,
              role: p.role,
              joined_at: p.joined_at,
              profiles: p.profiles as any
            })) || []
          };
        })
      );
      
      setChats(chatsWithParticipants);
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
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://ccyyxkjpgebjnstevgkw.supabase.co/functions/v1/messages?chat_id=${chatId}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch messages');
      const data = await response.json();
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
    if (!chatId || (!content.trim() && !mediaUrl)) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://ccyyxkjpgebjnstevgkw.supabase.co/functions/v1/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: chatId,
            content: content.trim(),
            reply_to: replyTo,
            media_url: mediaUrl,
            media_type: mediaType
          })
        }
      );

      if (!response.ok) throw new Error('Failed to send message');
      // Message will be added via real-time subscription
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!content.trim()) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://ccyyxkjpgebjnstevgkw.supabase.co/functions/v1/messages/${messageId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: content.trim() })
        }
      );

      if (!response.ok) throw new Error('Failed to edit message');
      const data = await response.json();
      
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

  const deleteMessage = async (messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://ccyyxkjpgebjnstevgkw.supabase.co/functions/v1/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete message');
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));

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

  const createChat = async (participantIds: string[], isGroup = false, name?: string) => {
    try {
      // Check if private chat already exists
      if (!isGroup && participantIds.length === 1) {
        const { data: existingChats } = await supabase
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user?.id);

        if (existingChats) {
          for (const chat of existingChats) {
            const { data: otherParticipant } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', chat.chat_id)
              .eq('user_id', participantIds[0])
              .single();

            if (otherParticipant) {
              await fetchChats();
              return chat.chat_id;
            }
          }
        }
      }

      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          name: name || null,
          type: isGroup ? 'group' : 'private'
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const participants = [
        { chat_id: chat.id, user_id: user?.id, role: 'admin' },
        ...participantIds.map(id => ({ chat_id: chat.id, user_id: id, role: 'member' }))
      ];

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      await fetchChats();
      return chat.id;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to create chat',
        variant: 'destructive'
      });
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
    refetchChats: fetchChats,
    refetchMessages: fetchMessages
  };
};