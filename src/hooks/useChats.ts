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

  const createChat = async (participantUuid: string) => {
    if (!user) {
      toast({
        title: 'AUTH_001',
        description: 'Please log in to start a chat',
        variant: 'destructive'
      });
      return null;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(participantUuid)) {
      toast({
        title: 'CHAT_002',
        description: 'Invalid user ID format',
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
        const errorData = response.error as any;
        const errorCode = errorData.code || 'CHAT_ERROR';
        const errorMsg = errorData.message || errorData.toString();
        
        console.error('[CHAT] Edge function error:', errorData);
        
        toast({
          title: errorCode,
          description: errorMsg,
          variant: 'destructive'
        });
        return null;
      }

      const chatData = response.data;
      console.log('[CHAT] Chat data received:', chatData);
      
      if (!chatData) {
        console.error('[CHAT] No data returned from edge function');
        toast({
          title: 'CHAT_006',
          description: 'No response from server',
          variant: 'destructive'
        });
        return null;
      }
      
      if (chatData.error) {
        console.error('[CHAT] Server returned error:', chatData);
        toast({
          title: chatData.code || 'CHAT_ERROR',
          description: chatData.message || chatData.error,
          variant: 'destructive'
        });
        return null;
      }

      if (!chatData.chat_id) {
        console.error('[CHAT] No chat_id in response:', chatData);
        toast({
          title: 'CHAT_005',
          description: 'Chat creation failed - no ID returned. Please try again.',
          variant: 'destructive'
        });
        return null;
      }

      console.log('[CHAT] Created successfully:', chatData.chat_id);
      await fetchChats();
      toast({
        title: 'Success',
        description: 'Chat created successfully!',
      });
      return chatData.chat_id;
    } catch (err: any) {
      console.error('[CHAT] Error:', err);
      toast({
        title: 'CHAT_ERROR',
        description: err.message || 'Failed to create chat',
        variant: 'destructive'
      });
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
