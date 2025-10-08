import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  privacy: string;
  reactions_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  reactions?: {
    id: string;
    user_id: string;
    reaction_type: string;
  }[];
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  const fetchPosts = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(
        'https://ccyyxkjpgebjnstevgkw.supabase.co/functions/v1/posts',
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: {
    content?: string;
    media_url?: string;
    media_type?: string;
    privacy?: string;
  }) => {
    if (!session?.access_token) {
      throw new Error('You must be logged in to create a post');
    }

    // Validate that at least content or media is provided
    if (!postData.content && !postData.media_url) {
      throw new Error('Post must have either content or media');
    }

    try {
      console.log('Creating post with data:', postData);
      
      const response = await fetch(
        'https://ccyyxkjpgebjnstevgkw.supabase.co/functions/v1/posts',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        }
      );

      const responseText = await response.text();
      console.log('Post creation response:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          throw new Error(`Failed to create post: ${responseText}`);
        }
        throw new Error(errorData.error || 'Failed to create post');
      }

      const data = JSON.parse(responseText);

      // Add new post to the beginning of the list
      setPosts(prevPosts => [data, ...prevPosts]);
      
      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });

      return data;
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleReaction = async (postId: string, reactionType: string) => {
    if (!session?.access_token) return;

    try {
      const { data, error } = await supabase.functions.invoke('reactions', {
        body: {
          target_id: postId,
          target_type: 'post',
          reaction_type: reactionType,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Update local state optimistically
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === postId) {
            const userReaction = post.reactions?.find(r => r.user_id === session.user?.id);
            
            if (data.action === 'removed') {
              return {
                ...post,
                reactions_count: Math.max(0, post.reactions_count - 1),
                reactions: post.reactions?.filter(r => r.user_id !== session.user?.id) || []
              };
            } else if (data.action === 'created') {
              return {
                ...post,
                reactions_count: post.reactions_count + 1,
                reactions: [
                  ...(post.reactions || []),
                  {
                    id: data.reaction.id,
                    user_id: session.user?.id || '',
                    reaction_type: reactionType
                  }
                ]
              };
            } else if (data.action === 'updated') {
              return {
                ...post,
                reactions: post.reactions?.map(r =>
                  r.user_id === session.user?.id
                    ? { ...r, reaction_type: reactionType }
                    : r
                ) || []
              };
            }
          }
          return post;
        })
      );

      return data;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPosts();

    // Set up real-time subscription for posts
    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          // Fetch the complete post data with profile info
          fetchPosts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.access_token]);

  return {
    posts,
    loading,
    fetchPosts,
    createPost,
    toggleReaction,
  };
};