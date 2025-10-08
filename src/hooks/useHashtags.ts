import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Hashtag {
  id: string;
  tag: string;
  usage_count: number;
  created_at: string;
}

export const useHashtags = () => {
  const { toast } = useToast();
  const [trending, setTrending] = useState<Hashtag[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrending = async (limit = 10) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setTrending(data || []);
    } catch (err: any) {
      console.error('Error fetching trending hashtags:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractHashtags = (text: string): string[] => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  };

  const processHashtags = async (postId: string, content: string) => {
    try {
      const tags = extractHashtags(content);
      if (tags.length === 0) return;

      // Create or update hashtags and link to post
      for (const tag of tags) {
        // Upsert hashtag
        const { data: hashtag, error: hashtagError } = await supabase
          .from('hashtags')
          .upsert({ 
            tag,
            usage_count: 1
          }, {
            onConflict: 'tag',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (hashtagError) throw hashtagError;

        // Link to post
        const { error: linkError } = await supabase
          .from('post_hashtags')
          .insert({
            post_id: postId,
            hashtag_id: hashtag.id
          })
          .select();

        if (linkError && !linkError.message.includes('duplicate')) {
          throw linkError;
        }
      }
    } catch (err: any) {
      console.error('Error processing hashtags:', err);
    }
  };

  const searchHashtags = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('hashtags')
        .select('*')
        .ilike('tag', `%${query}%`)
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error searching hashtags:', err);
      return [];
    }
  };

  const getPostsByHashtag = async (tag: string) => {
    try {
      setLoading(true);
      
      // Get hashtag id
      const { data: hashtag, error: hashtagError } = await supabase
        .from('hashtags')
        .select('id')
        .eq('tag', tag.toLowerCase())
        .single();

      if (hashtagError) throw hashtagError;

      // Get posts with this hashtag
      const { data: postHashtags, error: postsError } = await supabase
        .from('post_hashtags')
        .select(`
          post_id,
          posts (*)
        `)
        .eq('hashtag_id', hashtag.id);

      if (postsError) throw postsError;

      return postHashtags?.map(ph => (ph as any).posts) || [];
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return {
    trending,
    loading,
    extractHashtags,
    processHashtags,
    searchHashtags,
    getPostsByHashtag,
    refetch: fetchTrending
  };
};
