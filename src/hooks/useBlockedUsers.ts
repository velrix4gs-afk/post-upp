import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface BlockedUser {
  id: string;
  blocked_user_id: string;
  reason?: string;
  created_at: string;
  profile?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useBlockedUsers = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBlockedUsers();
    }
  }, [user]);

  const fetchBlockedUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = data.map(b => b.blocked_user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        const blockedWithProfiles = data.map(block => ({
          ...block,
          profile: profiles?.find(p => p.id === block.blocked_user_id),
        }));

        setBlockedUsers(blockedWithProfiles);
      } else {
        setBlockedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string, reason?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_id: user.id,
          blocked_user_id: userId,
          reason,
        });

      if (error) throw error;

      await fetchBlockedUsers();
      toast({ title: 'User blocked successfully' });
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({ title: 'Failed to block user', variant: 'destructive' });
    }
  };

  const unblockUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('user_id', user.id)
        .eq('blocked_user_id', userId);

      if (error) throw error;

      await fetchBlockedUsers();
      toast({ title: 'User unblocked successfully' });
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({ title: 'Failed to unblock user', variant: 'destructive' });
    }
  };

  const isBlocked = (userId: string) => {
    return blockedUsers.some(b => b.blocked_user_id === userId);
  };

  return {
    blockedUsers,
    loading,
    blockUser,
    unblockUser,
    isBlocked,
    refetch: fetchBlockedUsers,
  };
};
