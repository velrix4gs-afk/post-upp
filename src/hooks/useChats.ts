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
      // Check if chat already exists between these two users
      const { data: existingChats } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (existingChats) {
        for (const ec of existingChats) {
          // Check if this chat has the other user as participant
          const { data: otherParticipant } = await supabase
            .from('chat_participants')
            .select('user_id, chats:chat_id(type)')
            .eq('chat_id', ec.chat_id)
            .eq('user_id', participantUuid)
            .maybeSingle();

          if (otherParticipant) {
            // Get the chat type
            const { data: chatData } = await supabase
              .from('chats')
              .select('type')
              .eq('id', ec.chat_id)
              .single();

            if (chatData?.type === 'private') {
              console.log('[CHAT] Existing chat found:', ec.chat_id);
              return ec.chat_id;
            }
          }
        }
      }

      console.log('[CHAT] Creating new chat with UUID:', participantUuid);
      
      // Create new chat directly
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          type: 'private',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add both participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: newChat.id, user_id: user.id, role: 'member' },
          { chat_id: newChat.id, user_id: participantUuid, role: 'member' }
        ]);

      if (participantsError) throw participantsError;

      console.log('[CHAT] Created successfully:', newChat.id);
      await fetchChats();
      return newChat.id;
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
