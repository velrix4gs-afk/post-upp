import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface ThreadedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user: {
    display_name: string;
    avatar_url?: string;
    is_verified?: boolean;
    verification_type?: string | null;
    verified_at?: string | null;
  };
  replies?: ThreadedComment[];
}

export const useThreadedComments = (postId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<ThreadedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentLikes, setCommentLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (postId) {
      fetchComments();
      fetchUserLikes();
    }
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            is_verified,
            verification_type,
            verified_at
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform data and organize into threads
      const commentsWithUser = (data || []).map(comment => ({
        ...comment,
        user: comment.profiles
      }));

      // Build comment tree
      const commentMap = new Map<string, ThreadedComment>();
      const rootComments: ThreadedComment[] = [];

      // First pass: create all comments
      commentsWithUser.forEach(comment => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      // Second pass: organize into tree
      commentsWithUser.forEach(comment => {
        const commentNode = commentMap.get(comment.id)!;
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(commentNode);
          }
        } else {
          rootComments.push(commentNode);
        }
      });

      setComments(rootComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error loading comments',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setCommentLikes(new Set(data?.map(l => l.comment_id) || []));
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const addComment = async (content: string, parentId?: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId || null
        });

      if (error) throw error;

      await fetchComments();
      toast({ title: 'Comment added' });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Failed to add comment',
        variant: 'destructive'
      });
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchComments();
      toast({ title: 'Comment deleted' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Failed to delete comment',
        variant: 'destructive'
      });
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!user) return;

    const isLiked = commentLikes.has(commentId);

    try {
      if (isLiked) {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        setCommentLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      } else {
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          });

        setCommentLikes(prev => new Set(prev).add(commentId));
      }

      await fetchComments();
    } catch (error) {
      console.error('Error toggling comment like:', error);
    }
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    toggleLike,
    isCommentLiked: (commentId: string) => commentLikes.has(commentId),
    fetchComments
  };
};
