import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PostDraft {
  id: string;
  user_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  privacy: string;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

export const useDrafts = () => {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<PostDraft[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('post_drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async (draft: Partial<PostDraft>) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_drafts')
        .upsert({
          ...draft,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Draft saved'
      });

      await fetchDrafts();
      return data;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      const { error } = await supabase
        .from('post_drafts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Draft deleted'
      });

      await fetchDrafts();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  const publishDraft = async (draftId: string) => {
    try {
      setLoading(true);
      
      // Get draft
      const { data: draft, error: draftError } = await supabase
        .from('post_drafts')
        .select('*')
        .eq('id', draftId)
        .single();

      if (draftError) throw draftError;

      // Create post
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: draft.user_id,
          content: draft.content,
          media_url: draft.media_url,
          media_type: draft.media_type,
          privacy: draft.privacy,
          scheduled_for: draft.scheduled_for,
          is_published: !draft.scheduled_for
        });

      if (postError) throw postError;

      // Delete draft
      await deleteDraft(draftId);

      toast({
        title: 'Success',
        description: draft.scheduled_for ? 'Post scheduled' : 'Post published'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  return {
    drafts,
    loading,
    saveDraft,
    deleteDraft,
    publishDraft,
    refetch: fetchDrafts
  };
};
