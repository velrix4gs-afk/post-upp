import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', user?.id);

      if (error) throw error;

      setBookmarkedPosts(data?.map(b => b.post_id) || []);
    } catch (err: any) {
      console.error('Failed to fetch bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (postId: string) => {
    if (!user) return;

    const isBookmarked = bookmarkedPosts.includes(postId);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);

        if (error) throw error;

        setBookmarkedPosts(prev => prev.filter(id => id !== postId));
        toast({
          title: 'Removed from bookmarks'
        });
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            post_id: postId
          });

        if (error) throw error;

        setBookmarkedPosts(prev => [...prev, postId]);
        toast({
          title: 'Added to bookmarks'
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return {
    bookmarkedPosts,
    loading,
    toggleBookmark,
    isBookmarked: (postId: string) => bookmarkedPosts.includes(postId),
    refetch: fetchBookmarks
  };
};
