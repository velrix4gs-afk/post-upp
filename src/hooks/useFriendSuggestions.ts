import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FriendSuggestion {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  mutual_friends_count: number;
  mutual_friends: Array<{
    id: string;
    display_name: string;
    avatar_url?: string;
  }>;
}

export const useFriendSuggestions = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Get my friends
      const { data: myFriends } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const myFriendIds = myFriends?.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      ) || [];

      if (myFriendIds.length === 0) {
        // If no friends, suggest popular users
        const { data: popularUsers } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .neq('id', user.id)
          .limit(10);

        setSuggestions((popularUsers || []).map(u => ({
          ...u,
          mutual_friends_count: 0,
          mutual_friends: []
        })));
        setLoading(false);
        return;
      }

      // Get friends of my friends
      const { data: friendsOfFriends } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(myFriendIds.map(id => `requester_id.eq.${id},addressee_id.eq.${id}`).join(','))
        .eq('status', 'accepted');

      // Count mutual friends
      const suggestionMap = new Map<string, Set<string>>();
      
      friendsOfFriends?.forEach(friendship => {
        const potentialFriend = friendship.requester_id !== user.id && !myFriendIds.includes(friendship.requester_id)
          ? friendship.requester_id
          : friendship.addressee_id !== user.id && !myFriendIds.includes(friendship.addressee_id)
          ? friendship.addressee_id
          : null;

        if (potentialFriend && potentialFriend !== user.id) {
          if (!suggestionMap.has(potentialFriend)) {
            suggestionMap.set(potentialFriend, new Set());
          }
          
          const mutualFriend = friendship.requester_id === potentialFriend 
            ? friendship.addressee_id 
            : friendship.requester_id;
            
          if (myFriendIds.includes(mutualFriend)) {
            suggestionMap.get(potentialFriend)!.add(mutualFriend);
          }
        }
      });

      // Get profile info for suggestions
      const suggestionIds = Array.from(suggestionMap.keys()).slice(0, 10);
      
      if (suggestionIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', suggestionIds);

      // Get mutual friends details
      const suggestionsWithMutuals = await Promise.all(
        (profiles || []).map(async (profile) => {
          const mutualIds = Array.from(suggestionMap.get(profile.id) || []);
          
          const { data: mutualProfiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', mutualIds);

          return {
            ...profile,
            mutual_friends_count: mutualIds.length,
            mutual_friends: mutualProfiles || []
          };
        })
      );

      // Sort by mutual friends count
      suggestionsWithMutuals.sort((a, b) => b.mutual_friends_count - a.mutual_friends_count);
      setSuggestions(suggestionsWithMutuals);
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestions,
    loading,
    refetch: fetchSuggestions
  };
};
