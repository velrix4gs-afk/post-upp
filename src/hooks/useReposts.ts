import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useReposts = () => {
  const { user } = useAuth();
  const [reposts, setReposts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;

    const fetchReposts = async () => {
      const { data } = await supabase
        .from('reposts')
        .select('post_id')
        .eq('user_id', user.id);

      if (data) {
        const repostMap: Record<string, boolean> = {};
        data.forEach(r => repostMap[r.post_id] = true);
        setReposts(repostMap);
      }
    };

    fetchReposts();
  }, [user]);

  const toggleRepost = async (postId: string) => {
    if (!user) return;

    const isReposted = reposts[postId];

    // Optimistic update
    setReposts(prev => ({ ...prev, [postId]: !isReposted }));

    try {
      if (isReposted) {
        await supabase
          .from('reposts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('reposts')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      // Revert on error
      setReposts(prev => ({ ...prev, [postId]: isReposted }));
      console.error('Error toggling repost:', error);
    }
  };

  return { reposts, toggleRepost, isReposted: (postId: string) => !!reposts[postId] };
};
