import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const usePinnedChats = () => {
  const { user } = useAuth();
  const [pinnedChatIds, setPinnedChatIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchPinnedChats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pinned_chats')
        .select('chat_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setPinnedChatIds(new Set(data?.map(p => p.chat_id) || []));
    } catch (error: any) {
      console.error('Error fetching pinned chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePinChat = async (chatId: string) => {
    if (!user) return;

    try {
      const isPinned = pinnedChatIds.has(chatId);

      if (isPinned) {
        // Unpin
        const { error } = await supabase
          .from('pinned_chats')
          .delete()
          .eq('chat_id', chatId)
          .eq('user_id', user.id);

        if (error) throw error;

        setPinnedChatIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(chatId);
          return newSet;
        });

        toast({
          title: 'Chat unpinned',
          description: 'Chat has been unpinned',
        });
      } else {
        // Pin
        const { error } = await supabase
          .from('pinned_chats')
          .insert({ chat_id: chatId, user_id: user.id });

        if (error) throw error;

        setPinnedChatIds(prev => new Set(prev).add(chatId));

        toast({
          title: 'Chat pinned',
          description: 'Chat has been pinned to the top',
        });
      }
    } catch (error: any) {
      console.error('Error toggling pin:', error);
      toast({
        title: 'Error',
        description: 'Failed to update pin status',
        variant: 'destructive',
      });
    }
  };

  const isPinned = (chatId: string) => pinnedChatIds.has(chatId);

  useEffect(() => {
    fetchPinnedChats();
  }, [user]);

  return {
    pinnedChatIds,
    loading,
    togglePinChat,
    isPinned,
    refetch: fetchPinnedChats,
  };
};
