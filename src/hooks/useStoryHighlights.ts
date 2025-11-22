import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_image?: string;
  created_at: string;
  story_count?: number;
}

export const useStoryHighlights = (userId?: string) => {
  const { user } = useAuth();
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchHighlights();
    }
  }, [targetUserId]);

  const fetchHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('story_highlights')
        .select(`
          *,
          story_highlight_items(count)
        `)
        .eq('user_id', targetUserId!)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedHighlights = data?.map(h => ({
        ...h,
        story_count: h.story_highlight_items?.[0]?.count || 0
      })) || [];

      setHighlights(formattedHighlights);
    } catch (err) {
      console.error('Failed to fetch highlights:', err);
    } finally {
      setLoading(false);
    }
  };

  const createHighlight = async (title: string, coverImage?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('story_highlights')
        .insert({
          user_id: user.id,
          title,
          cover_image: coverImage
        })
        .select()
        .single();

      if (error) throw error;

      await fetchHighlights();
      toast({ title: 'Highlight created' });
      return data.id;
    } catch (err: any) {
      toast({
        title: 'Failed to create highlight',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const addStoryToHighlight = async (highlightId: string, storyId: string) => {
    try {
      const { error } = await supabase
        .from('story_highlight_items')
        .insert({
          highlight_id: highlightId,
          story_id: storyId
        });

      if (error) throw error;

      await fetchHighlights();
      toast({ title: 'Story added to highlight' });
    } catch (err: any) {
      toast({
        title: 'Failed to add story',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const deleteHighlight = async (highlightId: string) => {
    try {
      const { error } = await supabase
        .from('story_highlights')
        .delete()
        .eq('id', highlightId);

      if (error) throw error;

      await fetchHighlights();
      toast({ title: 'Highlight deleted' });
    } catch (err: any) {
      toast({
        title: 'Failed to delete highlight',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return {
    highlights,
    loading,
    createHighlight,
    addStoryToHighlight,
    deleteHighlight,
    refetch: fetchHighlights
  };
};