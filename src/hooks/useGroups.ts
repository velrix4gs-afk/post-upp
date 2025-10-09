import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Group {
  id: string;
  name: string;
  description?: string;
  privacy: 'public' | 'private';
  avatar_url?: string;
  cover_url?: string;
  created_by: string;
  member_count: number;
  created_at: string;
  updated_at: string;
  is_member?: boolean;
  user_role?: 'admin' | 'moderator' | 'member';
}

export const useGroups = () => {
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMyGroups = async () => {
    if (!user) return;

    const { data: memberData } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id);

    if (!memberData || memberData.length === 0) {
      setMyGroups([]);
      return;
    }

    const groupIds = memberData.map(m => m.group_id);
    
    const { data: groups } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);

    if (groups) {
      const groupsWithRole = groups.map(g => ({
        ...g,
        privacy: g.privacy as 'public' | 'private',
        is_member: true,
        user_role: memberData.find(m => m.group_id === g.id)?.role as 'admin' | 'moderator' | 'member'
      }));
      setMyGroups(groupsWithRole);
    }
  };

  const fetchDiscoverGroups = async () => {
    if (!user) return;

    const { data: groups } = await supabase
      .from('groups')
      .select('*')
      .eq('privacy', 'public')
      .order('member_count', { ascending: false })
      .limit(20);

    if (groups) {
      // Check membership status
      const { data: memberData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const memberGroupIds = memberData?.map(m => m.group_id) || [];
      
      const groupsWithStatus = groups.map(g => ({
        ...g,
        privacy: g.privacy as 'public' | 'private',
        is_member: memberGroupIds.includes(g.id)
      }));

      setDiscoverGroups(groupsWithStatus);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchMyGroups(), fetchDiscoverGroups()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  const createGroup = async (groupData: {
    name: string;
    description?: string;
    privacy: 'public' | 'private';
    avatar_url?: string;
    cover_url?: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase.functions.invoke('groups', {
      body: { action: 'create', ...groupData },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
      return null;
    }

    await fetchMyGroups();
    await fetchDiscoverGroups();

    toast({
      title: 'Success',
      description: 'Group created successfully',
    });

    return data.group;
  };

  const updateGroup = async (groupId: string, updates: {
    name?: string;
    description?: string;
    privacy?: 'public' | 'private';
    avatar_url?: string;
    cover_url?: string;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase.functions.invoke('groups', {
      body: { action: 'update', group_id: groupId, ...updates },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update group',
        variant: 'destructive',
      });
      return false;
    }

    await fetchMyGroups();
    await fetchDiscoverGroups();

    toast({
      title: 'Success',
      description: 'Group updated successfully',
    });

    return true;
  };

  const joinGroup = async (groupId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase.functions.invoke('groups', {
      body: { action: 'join', group_id: groupId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to join group',
        variant: 'destructive',
      });
      return false;
    }

    await fetchMyGroups();
    await fetchDiscoverGroups();

    toast({
      title: 'Success',
      description: 'Joined group successfully',
    });

    return true;
  };

  const leaveGroup = async (groupId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase.functions.invoke('groups', {
      body: { action: 'leave', group_id: groupId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to leave group',
        variant: 'destructive',
      });
      return false;
    }

    await fetchMyGroups();
    await fetchDiscoverGroups();

    toast({
      title: 'Success',
      description: 'Left group successfully',
    });

    return true;
  };

  const uploadGroupImage = async (file: File, type: 'avatar' | 'cover') => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${type}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('group-images')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
      return null;
    }

    const { data } = supabase.storage
      .from('group-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return {
    myGroups,
    discoverGroups,
    loading,
    createGroup,
    updateGroup,
    joinGroup,
    leaveGroup,
    uploadGroupImage,
    refetch: () => {
      fetchMyGroups();
      fetchDiscoverGroups();
    },
  };
};
