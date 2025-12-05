import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserReply {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  post?: {
    id: string;
    content: string;
    user_id: string;
    profiles?: {
      display_name: string;
      username: string;
      avatar_url?: string;
    };
  };
}

export const useUserReplies = (userId?: string) => {
  const [replies, setReplies] = useState<UserReply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplies = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            post_id,
            posts!inner (
              id,
              content,
              user_id,
              profiles (
                display_name,
                username,
                avatar_url
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formattedReplies = (data || []).map((item: any) => ({
          id: item.id,
          content: item.content,
          created_at: item.created_at,
          post_id: item.post_id,
          post: item.posts ? {
            id: item.posts.id,
            content: item.posts.content,
            user_id: item.posts.user_id,
            profiles: item.posts.profiles
          } : undefined
        }));

        setReplies(formattedReplies);
      } catch (error) {
        console.error('Error fetching user replies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReplies();
  }, [userId]);

  return { replies, loading };
};