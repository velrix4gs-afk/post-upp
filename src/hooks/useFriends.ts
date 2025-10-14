import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
  requester: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
  addressee: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFriendships();

      // Set up real-time subscription for friendships
      const channel = supabase
        .channel('friendships-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friendships',
            filter: `requester_id=eq.${user.id},addressee_id=eq.${user.id}`
          },
          () => {
            fetchFriendships();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchFriendships = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('friendships', {
        method: 'GET'
      });

      if (error) throw error;
      setFriendships(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load friendships',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('friendships', {
        method: 'POST',
        body: { addressee_id: addresseeId, action: 'request' }
      });

      if (error) throw error;
      await fetchFriendships();
      toast({
        title: 'Success',
        description: 'Friend request sent'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const acceptFriendRequest = async (requesterId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('friendships', {
        method: 'POST',
        body: { addressee_id: requesterId, action: 'accept' }
      });

      if (error) throw error;
      await fetchFriendships();
      toast({
        title: 'Success',
        description: 'Friend request accepted'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const declineFriendRequest = async (requesterId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('friendships', {
        method: 'POST',
        body: { addressee_id: requesterId, action: 'decline' }
      });

      if (error) throw error;
      await fetchFriendships();
      toast({
        title: 'Success',
        description: 'Friend request declined'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('friendships', {
        method: 'DELETE',
        body: { friend_id: friendId }
      });

      if (error) throw error;
      await fetchFriendships();
      toast({
        title: 'Success',
        description: 'Friend removed'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const getFriends = () => {
    return friendships.filter(f => f.status === 'accepted').map(f => {
      const friend = f.requester_id === user?.id ? f.addressee : f.requester;
      return { ...friend, friendship_id: f.id };
    });
  };

  const getPendingRequests = () => {
    return friendships.filter(f => 
      f.status === 'pending' && f.addressee_id === user?.id
    );
  };

  const getSentRequests = () => {
    return friendships.filter(f => 
      f.status === 'pending' && f.requester_id === user?.id
    );
  };

  return {
    friendships,
    friends: getFriends(),
    pendingRequests: getPendingRequests(),
    sentRequests: getSentRequests(),
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    refetch: fetchFriendships
  };
};