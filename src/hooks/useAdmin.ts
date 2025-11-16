import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user?.id]);

  const checkAdminStatus = async () => {
    if (!user?.id) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!error && data !== null);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnyPost = async (postId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'You do not have admin privileges',
        variant: 'destructive'
      });
      return { error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Post Deleted',
        description: 'The post has been removed'
      });

      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
      return { error: err.message };
    }
  };

  const banUser = async (userId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'You do not have admin privileges',
        variant: 'destructive'
      });
      return { error: 'Unauthorized' };
    }

    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: user?.id || '',
          blocked_user_id: userId,
          reason: 'Banned by admin'
        });

      if (error) throw error;

      toast({
        title: 'User Banned',
        description: 'The user has been banned'
      });

      return { error: null };
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
      return { error: err.message };
    }
  };

  return { isAdmin, loading, deleteAnyPost, banUser };
};
