import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Group {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  privacy: 'public' | 'private';
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  is_member?: boolean;
  role?: string;
}

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchMyGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check membership for each group
      const groupsWithMembership = await Promise.all(
        (data || []).map(async (group) => {
          const { data: membership } = await supabase
            .from('group_members')
            .select('role')
            .eq('group_id', group.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...group,
            privacy: group.privacy as 'public' | 'private',
            is_member: !!membership,
            role: membership?.role
          };
        })
      );

      setGroups(groupsWithMembership);
    } catch (err: any) {
      console.error('[GROUP_001] Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user?.id);

      if (memberError) throw memberError;

      const groupIds = memberships?.map(m => m.group_id) || [];
      
      if (groupIds.length === 0) {
        setMyGroups([]);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) throw groupsError;

      const groupsWithRole = (groupsData || []).map(group => {
        const membership = memberships?.find(m => m.group_id === group.id);
        return {
          ...group,
          privacy: group.privacy as 'public' | 'private',
          is_member: true,
          role: membership?.role
        };
      });

      setMyGroups(groupsWithRole);
    } catch (err: any) {
      console.error('[GROUP_002] Failed to load my groups:', err);
    }
  };

  const createGroup = async (groupData: {
    name: string;
    description?: string;
    privacy: 'public' | 'private';
    avatar?: File;
  }) => {
    if (!user) return;

    try {
      let avatar_url = null;

      if (groupData.avatar) {
        const fileExt = groupData.avatar.name.split('.').pop();
        const fileName = `groups/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('group-images')
          .upload(fileName, groupData.avatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('group-images')
          .getPublicUrl(fileName);

        avatar_url = publicUrl;
      }

      const { error } = await supabase
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          privacy: groupData.privacy,
          avatar_url,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Group created successfully!',
      });
      
      await fetchGroups();
      await fetchMyGroups();
    } catch (err: any) {
      console.error('[GROUP_003] Failed to create group:', err);
      toast({
        title: 'Error',
        description: '[GROUP_003] Failed to create group',
        variant: 'destructive'
      });
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Joined group!',
      });

      await fetchGroups();
      await fetchMyGroups();
    } catch (err: any) {
      console.error('[GROUP_004] Failed to join group:', err);
      toast({
        title: 'Error',
        description: '[GROUP_004] Failed to join group',
        variant: 'destructive'
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Left group',
      });

      await fetchGroups();
      await fetchMyGroups();
    } catch (err: any) {
      console.error('[GROUP_005] Failed to leave group:', err);
      toast({
        title: 'Error',
        description: '[GROUP_005] Failed to leave group',
        variant: 'destructive'
      });
    }
  };

  return {
    groups,
    myGroups,
    loading,
    createGroup,
    joinGroup,
    leaveGroup,
    refetch: () => {
      fetchGroups();
      fetchMyGroups();
    }
  };
};
