import { useAdmin } from './useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';
import { logError } from '@/lib/errorLogger';

export const useEnhancedAdmin = () => {
  const { isAdmin, loading } = useAdmin();

  const deleteAnyPost = async (postId: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post Deleted",
        description: "Post has been removed successfully"
      });
      
      return true;
    } catch (error: any) {
      await logError({
        type: 'database',
        message: 'Failed to delete post',
        error,
        severity: 'error',
        componentName: 'useEnhancedAdmin'
      });
      
      toast({
        title: "Delete Failed",
        description: "Unable to delete post",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const banUser = async (userId: string, reason?: string) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: user.id,
          blocked_user_id: userId,
          reason: reason || 'Admin ban'
        });

      if (error) throw error;

      toast({
        title: "User Banned",
        description: "User has been banned successfully"
      });
      
      return true;
    } catch (error: any) {
      await logError({
        type: 'database',
        message: 'Failed to ban user',
        error,
        severity: 'error',
        componentName: 'useEnhancedAdmin'
      });
      
      toast({
        title: "Ban Failed",
        description: "Unable to ban user",
        variant: "destructive"
      });
      
      return false;
    }
  };

  const viewBlockedUsers = async () => {
    if (!isAdmin) return [];

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          *,
          blocker:profiles!user_id(id, display_name, username),
          blocked:profiles!blocked_user_id(id, display_name, username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      await logError({
        type: 'database',
        message: 'Failed to fetch blocked users',
        error,
        severity: 'error',
        componentName: 'useEnhancedAdmin'
      });
      return [];
    }
  };

  const viewErrorLogs = async (limit = 50) => {
    if (!isAdmin) return [];

    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to fetch error logs:', error);
      return [];
    }
  };

  const resolveError = async (errorId: string) => {
    if (!isAdmin) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id
        })
        .eq('id', errorId);

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    isAdmin,
    loading,
    deleteAnyPost,
    banUser,
    viewBlockedUsers,
    viewErrorLogs,
    resolveError
  };
};
