import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Collaborator {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

export const useEventCollaborators = (eventId?: string) => {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchCollaborators();
    }
  }, [eventId]);

  const fetchCollaborators = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from('event_collaborators')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profiles!user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        ...item,
        profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      }));

      setCollaborators(formatted as any);
    } catch (error: any) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCollaborator = async (userId: string) => {
    if (!eventId || !user) return;

    try {
      const { error } = await supabase
        .from('event_collaborators')
        .insert({
          event_id: eventId,
          user_id: userId,
          role: 'collaborator'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collaborator added successfully'
      });

      await fetchCollaborators();
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      toast({
        title: 'Error',
        description: 'Failed to add collaborator',
        variant: 'destructive'
      });
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Collaborator removed successfully'
      });

      await fetchCollaborators();
    } catch (error: any) {
      console.error('Error removing collaborator:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove collaborator',
        variant: 'destructive'
      });
    }
  };

  return {
    collaborators,
    loading,
    addCollaborator,
    removeCollaborator,
    refetch: fetchCollaborators
  };
};
