import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  follower?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
    verification_type?: string | null;
    verified_at?: string | null;
  };
  following?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
    verification_type?: string | null;
    verified_at?: string | null;
  };
}

export const useFollowers = (userId?: string) => {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchFollowers();

      // Set up real-time subscription for followers
      // Subscribe to changes where user is the follower OR following
      const channel = supabase
        .channel('followers-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'followers',
            filter: `follower_id=eq.${targetUserId}`
          },
          () => {
            fetchFollowers();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'followers',
            filter: `following_id=eq.${targetUserId}`
          },
          () => {
            fetchFollowers();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [targetUserId]);

  const fetchFollowers = async () => {
    try {
      setLoading(true);

      // Fetch followers
      const { data: followersData, error: followersError } = await supabase
        .from('followers')
        .select(`
          *,
          follower:profiles!followers_follower_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            is_verified,
            verification_type,
            verified_at
          )
        `)
        .eq('following_id', targetUserId)
        .eq('status', 'accepted');

      if (followersError) throw followersError;

      // Fetch following
      const { data: followingData, error: followingError } = await supabase
        .from('followers')
        .select(`
          *,
          following:profiles!followers_following_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            is_verified,
            verification_type,
            verified_at
          )
        `)
        .eq('follower_id', targetUserId)
        .eq('status', 'accepted');

      if (followingError) throw followingError;

      setFollowers((followersData as any) || []);
      setFollowing((followingData as any) || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load followers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (followingId: string, isPrivate: boolean = false) => {
    if (!user) return;

    // Optimistic update
    setFollowing(prev => [...prev, {
      id: 'temp',
      follower_id: user.id,
      following_id: followingId,
      status: 'accepted' as const,
      created_at: new Date().toISOString()
    }]);

    try {
      // Add to followers table (the trigger will auto-create friendship)
      const { error: followError } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: followingId,
          status: isPrivate ? 'pending' : 'accepted'
        });

      if (followError) {
        // Revert optimistic update
        setFollowing(prev => prev.filter(f => f.id !== 'temp'));
        throw followError;
      }

      toast({
        description: isPrivate ? 'Follow request sent' : 'Following'
      });

      // Fetch to get the real record
      await fetchFollowers();
    } catch (err: any) {
      console.error('Error following user:', err);
      toast({
        description: err.message?.includes('duplicate') 
          ? 'Already following' 
          : 'Failed to follow',
        variant: 'destructive'
      });
    }
  };

  const unfollowUser = async (followingId: string) => {
    if (!user) return;

    // Optimistic update
    setFollowing(prev => prev.filter(f => f.following_id !== followingId));

    try {
      // Remove from followers table (the trigger will auto-remove friendship)
      const { error: followError } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (followError) {
        // Revert optimistic update
        await fetchFollowers();
        throw followError;
      }

      toast({
        description: 'Unfollowed'
      });
    } catch (err: any) {
      console.error('Error unfollowing user:', err);
      toast({
        description: 'Failed to unfollow',
        variant: 'destructive'
      });
    }
  };

  const acceptFollowRequest = async (followerId: string) => {
    try {
      const { error } = await supabase
        .from('followers')
        .update({ status: 'accepted' })
        .eq('follower_id', followerId)
        .eq('following_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Follow request accepted'
      });

      fetchFollowers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const rejectFollowRequest = async (followerId: string) => {
    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Follow request rejected'
      });

      fetchFollowers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return {
    followers,
    following,
    loading,
    followUser,
    unfollowUser,
    acceptFollowRequest,
    rejectFollowRequest,
    refetch: fetchFollowers
  };
};
