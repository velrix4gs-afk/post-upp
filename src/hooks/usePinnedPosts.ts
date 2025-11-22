import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const usePinnedPosts = (userId?: string) => {
  const { user } = useAuth();
  const [pinnedPostIds, setPinnedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchPinnedPosts();
    }
  }, [targetUserId]);

  const fetchPinnedPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('pinned_posts')
        .select('post_id')
        .eq('user_id', targetUserId!)
        .order('pinned_at', { ascending: false });

      if (error) throw error;
      setPinnedPostIds(data?.map(p => p.post_id) || []);
    } catch (err) {
      console.error('Failed to fetch pinned posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const pinPost = async (postId: string) => {
    if (!user) return;

    try {
      // Check limit (max 3 pinned posts)
      if (pinnedPostIds.length >= 3) {
        toast({
          title: 'Limit reached',
          description: 'You can only pin up to 3 posts',
          variant: 'destructive'
        });
        return;
      }

      const { error } = await supabase
        .from('pinned_posts')
        .insert({ user_id: user.id, post_id: postId });

      if (error) throw error;

      await fetchPinnedPosts();
      toast({ title: 'Post pinned to profile' });
    } catch (err: any) {
      toast({
        title: 'Failed to pin post',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const unpinPost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('pinned_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) throw error;

      await fetchPinnedPosts();
      toast({ title: 'Post unpinned' });
    } catch (err: any) {
      toast({
        title: 'Failed to unpin post',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const isPinned = (postId: string) => pinnedPostIds.includes(postId);

  return {
    pinnedPostIds,
    loading,
    pinPost,
    unpinPost,
    isPinned,
    refetch: fetchPinnedPosts
  };
};