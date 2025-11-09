import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface GroupPost {
  id: string;
  group_id: string;
  post_id: string;
  created_at: string;
  posts: {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    reactions_count: number;
    comments_count: number;
    shares_count: number;
    profiles: {
      display_name: string;
      avatar_url: string | null;
      username: string;
    };
  };
}

export const useGroupPosts = (groupId?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupPosts = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('group_posts')
        .select(`
          *,
          posts (
            *,
            profiles:user_id (
              display_name,
              avatar_url,
              username
            )
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching group posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load group posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createGroupPost = async (content: string, mediaFiles?: File[]) => {
    if (!user || !groupId) return;

    try {
      // First create the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Upload media if provided
      if (mediaFiles && mediaFiles.length > 0) {
        for (const file of mediaFiles) {
          const filePath = `${user.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('posts')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(filePath);

          // Create media record
          await supabase.from('media').insert({
            user_id: user.id,
            post_id: postData.id,
            url: publicUrl,
            mime: file.type,
            size: file.size,
          });
        }
      }

      // Link post to group
      const { error: groupPostError } = await supabase
        .from('group_posts')
        .insert({
          group_id: groupId,
          post_id: postData.id,
        });

      if (groupPostError) throw groupPostError;

      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });

      fetchGroupPosts();
    } catch (error: any) {
      console.error('Error creating group post:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    }
  };

  const deleteGroupPost = async (groupPostId: string, postId: string) => {
    if (!user) return;

    try {
      // Delete group post link
      const { error: groupPostError } = await supabase
        .from('group_posts')
        .delete()
        .eq('id', groupPostId);

      if (groupPostError) throw groupPostError;

      // Delete the actual post
      const { error: postError } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (postError) throw postError;

      toast({
        title: 'Success',
        description: 'Post deleted successfully',
      });

      fetchGroupPosts();
    } catch (error: any) {
      console.error('Error deleting group post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchGroupPosts();

      // Subscribe to realtime updates
      const subscription = supabase
        .channel(`group_posts_${groupId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'group_posts',
            filter: `group_id=eq.${groupId}`
          },
          () => {
            fetchGroupPosts();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [groupId, user]);

  return {
    posts,
    loading,
    createGroupPost,
    deleteGroupPost,
    refetch: fetchGroupPosts,
  };
};
