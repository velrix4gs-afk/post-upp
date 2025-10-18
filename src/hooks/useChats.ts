import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { showCleanError } from '@/lib/errorHandler';

export interface Chat {
  id: string;
  name?: string;
  avatar_url?: string;
  is_group: boolean;
  type: string;
  created_at: string;
  other_user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      
      // Get all chats the user is part of
      const { data: chatParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select(`
          chat_id,
          chats:chat_id (
            id,
            name,
            avatar_url,
            type,
            created_at
          )
        `)
        .eq('user_id', user?.id);

      if (participantsError) throw participantsError;

      // Process chats and get other participants for private chats
      const processedChats = await Promise.all(
        (chatParticipants || []).map(async (cp: any) => {
          const chat = cp.chats;
          if (!chat) return null;

          if (chat.type === 'private') {
            // Get the other participant
            const { data: otherParticipant } = await supabase
              .from('chat_participants')
              .select(`
                user_id,
                profiles:user_id (
                  id,
                  username,
                  display_name,
                  avatar_url
                )
              `)
              .eq('chat_id', chat.id)
              .neq('user_id', user?.id)
              .single();

            return {
              ...chat,
              is_group: false,
              other_user: otherParticipant?.profiles
            };
          }

          return {
            ...chat,
            is_group: chat.type === 'group'
          };
        })
      );

      setChats(processedChats.filter(Boolean) as Chat[]);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load chats',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (participantId: string) => {
    if (!user) {
      console.error('No user found');
      toast({
        title: 'Error',
        description: 'You must be logged in to create a chat',
        variant: 'destructive'
      });
      return null;
    }

    try {
      // Check if chat already exists
      const { data: existingChats } = await supabase
        .from('chat_participants')
        .select('chat_id, chats:chat_id(type)')
        .eq('user_id', user.id);

      if (existingChats) {
        for (const ec of existingChats) {
          if (ec.chats?.type === 'private') {
            const { data: otherParticipant } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', ec.chat_id)
              .neq('user_id', user.id)
              .single();

            if (otherParticipant?.user_id === participantId) {
              console.log('Found existing chat:', ec.chat_id);
              return ec.chat_id;
            }
          }
        }
      }

      // Create new chat using edge function to bypass RLS complexity
      console.log('Creating new chat for participant:', participantId);
      
      const response = await supabase.functions.invoke('friendships', {
        body: {
          action: 'create_chat',
          participant_id: participantId
        }
      });

      console.log('Full response:', response);

      if (response.error) {
        console.error('Chat creation error:', response.error);
        throw new Error(response.error.message || 'Failed to create chat');
      }

      const chatData = response.data;
      if (!chatData) {
        console.error('No data in response');
        throw new Error('No response data from server');
      }

      if (!chatData.chat_id) {
        console.error('No chat_id in response. Full data:', chatData);
        throw new Error('Server did not return chat ID');
      }

      console.log('Chat created successfully with ID:', chatData.chat_id);
      await fetchChats();
      return chatData.chat_id;
    } catch (err: any) {
      console.error('Create chat error:', err);
      showCleanError(err, toast);
      return null;
    }
  };

  return {
    chats,
    loading,
    fetchChats,
    createChat
  };
};
