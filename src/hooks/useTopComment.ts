import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopComment {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  user: {
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
    verification_type?: string | null;
  };
}

export const useTopComment = (postId: string, commentsCount: number) => {
  const [topComment, setTopComment] = useState<TopComment | null>(null);

  useEffect(() => {
    if (!postId || commentsCount === 0) {
      setTopComment(null);
      return;
    }

    const fetchTopComment = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, content, likes_count, created_at, user_id,
          profiles:user_id (
            display_name,
            avatar_url,
            is_verified,
            verification_type
          )
        `)
        .eq('post_id', postId)
        .is('parent_id', null)
        .order('likes_count', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setTopComment({
          ...data,
          likes_count: data.likes_count ?? 0,
          user: data.profiles as any
        });
      }
    };

    fetchTopComment();
  }, [postId, commentsCount]);

  return topComment;
};
