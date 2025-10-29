import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
      console.error('[CHAT] Failed to load chats:', err);
      // Silently fail - user doesn't need to see this error
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (participantUuid: string) => {
    if (!user) {
      console.error('[CHAT] User not authenticated');
      return null;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(participantUuid)) {
      console.error('[CHAT] Invalid UUID format:', participantUuid);
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
              .maybeSingle();

            if (otherParticipant?.user_id === participantUuid) {
              console.log('[CHAT] Existing chat found:', ec.chat_id);
              return ec.chat_id;
            }
          }
        }
      }

      console.log('[CHAT] Creating new chat with UUID:', participantUuid);
      
      const response = await supabase.functions.invoke('friendships', {
        body: {
          action: 'create_chat',
          participant_uuid: participantUuid
        }
      });

      console.log('[CHAT] Edge function response:', response);

      if (response.error) {
        console.error('[CHAT] Edge function error:', response.error);
        return null;
      }

      const chatData = response.data;
      console.log('[CHAT] Chat data received:', chatData);
      
      if (!chatData || chatData.error || !chatData.chat_id) {
        console.error('[CHAT] Invalid response:', chatData);
        return null;
      }

      console.log('[CHAT] Created successfully:', chatData.chat_id);
      await fetchChats();
      return chatData.chat_id;
    } catch (err: any) {
      console.error('[CHAT] Error:', err);
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
