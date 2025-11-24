import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export const REACTION_EMOJIS: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  angry: '😠'
};

interface ReactionCounts {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
}

export const useReactions = (postId: string) => {
  const { user } = useAuth();
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReactions();
    }
  }, [postId, user]);

  const fetchReactions = async () => {
    try {
      // Get all reactions for this post
      const { data: reactions, error } = await supabase
        .from('post_reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId);

      if (error) throw error;

      // Count reactions by type
      const counts: ReactionCounts = {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0
      };

      reactions?.forEach(r => {
        const type = r.reaction_type as ReactionType;
        if (type in counts) {
          counts[type]++;
        }
        // Check if user has reacted
        if (r.user_id === user?.id) {
          setUserReaction(type);
        }
      });

      setReactionCounts(counts);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReaction = async (type: ReactionType) => {
    if (!user) return;

    try {
      // If user already has this reaction, remove it
      if (userReaction === type) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setUserReaction(null);
        setReactionCounts(prev => ({
          ...prev,
          [type]: Math.max(0, prev[type] - 1)
        }));
      } else {
        // Remove old reaction if exists
        if (userReaction) {
          await supabase
            .from('post_reactions')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          setReactionCounts(prev => ({
            ...prev,
            [userReaction]: Math.max(0, prev[userReaction] - 1)
          }));
        }

        // Add new reaction
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: type
          });

        setUserReaction(type);
        setReactionCounts(prev => ({
          ...prev,
          [type]: prev[type] + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  return {
    userReaction,
    reactionCounts,
    loading,
    toggleReaction,
    getTotalReactions
  };
};
