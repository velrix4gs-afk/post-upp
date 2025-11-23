import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Post } from './usePosts';

export type FeedType = 'for-you' | 'following' | 'trending';

export const useFeed = (feedType: FeedType = 'for-you') => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = async (pageNum: number = 1, reset: boolean = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const limit = 10;
      const offset = (pageNum - 1) * limit;

      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          media_url,
          media_type,
          privacy,
          reactions_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (feedType === 'following') {
        // Get posts from users the current user follows
        const { data: followingData } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = followingData?.map(f => f.following_id) || [];
        
        if (followingIds.length === 0) {
          setPosts([]);
          setHasMore(false);
          return;
        }

        query = query.in('user_id', followingIds);
      } else if (feedType === 'for-you') {
        // Get posts from friends using friendships table
        const { data: friendsData } = await supabase
          .from('friends')
          .select('requester_id, receiver_id')
          .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'accepted');

        const friendIds = friendsData?.map(f => 
          f.requester_id === user.id ? f.receiver_id : f.requester_id
        ) || [];

        // Get user's profile to get region info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();

        // If user has friends, prioritize their posts, otherwise show random posts
        if (friendIds.length > 0) {
          query = query.in('user_id', [...friendIds, user.id]);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const newPosts = (data || []) as Post[];
      
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === limit);
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, false);
    }
  };

  const refresh = () => {
    setPage(1);
    fetchFeed(1, true);
  };

  // Fix: Only refresh on initial mount and user change, not on feedType change
  useEffect(() => {
    if (user) {
      setPage(1);
      fetchFeed(1, true);
    }
  }, [user]);

  // Separate effect for feedType changes to avoid scroll reset
  useEffect(() => {
    if (user && feedType) {
      setPage(1);
      fetchFeed(1, true);
    }
  }, [feedType]);

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    refresh
  };
};
