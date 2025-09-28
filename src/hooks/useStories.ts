import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Story {
  id: string;
  user_id: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  views_count: number;
  created_at: string;
  expires_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStories();
      
      // Set up real-time subscription for stories
      const channel = supabase
        .channel('stories-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'stories'
        }, () => {
          fetchStories();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles (
            username,
            display_name,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load stories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createStory = async (content?: string, mediaFile?: File) => {
    if (!user || (!content && !mediaFile)) return;

    try {
      let media_url = null;
      let media_type = null;

      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, mediaFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        media_url = publicUrl;
        media_type = mediaFile.type.startsWith('video/') ? 'video' : 'image';
      }

      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          content,
          media_url,
          media_type
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Story created successfully!',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to create story',
        variant: 'destructive'
      });
    }
  };

  const viewStory = async (storyId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user.id
        });

      if (error && !error.message.includes('duplicate')) throw error;
    } catch (err: any) {
      console.error('Failed to record story view:', err);
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Story deleted successfully!',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete story',
        variant: 'destructive'
      });
    }
  };

  return {
    stories,
    loading,
    createStory,
    viewStory,
    deleteStory,
    refetch: fetchStories
  };
};