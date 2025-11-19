import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cache, STORES } from '@/lib/cache';

export interface CreatorPage {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  bio: string | null;
  cover_url: string | null;
  profile_url: string | null;
  cover_media_id: string | null;
  profile_media_id: string | null;
  is_published: boolean;
  monetization_enabled: boolean;
  custom_css: string | null;
  social_links: any;
  created_at: string;
  updated_at: string;
}

export const useCreatorPages = (userId?: string) => {
  const [pages, setPages] = useState<CreatorPage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return;

      // Try cache first
      const cacheKey = `pages_${targetUserId}`;
      const cachedData = await cache.get(STORES.PAGES, cacheKey);
      
      if (cachedData) {
        setPages(cachedData as CreatorPage[]);
        setLoading(false);
        // Still fetch in background
      }

      const { data, error } = await supabase
        .from('creator_pages')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const pagesData = data || [];
      setPages(pagesData);
      
      // Update cache
      await cache.set(STORES.PAGES, cacheKey, pagesData);
    } catch (error) {
      console.error('Error fetching creator pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPageBySlug = async (slug: string): Promise<CreatorPage | null> => {
    try {
      const { data, error } = await supabase
        .from('creator_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching creator page:', error);
      return null;
    }
  };

  const createPage = async (pageData: Partial<CreatorPage>): Promise<CreatorPage | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('creator_pages')
        .insert({
          ...pageData,
          user_id: user.id
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Creator page created successfully"
      });

      await fetchPages();
      return data;
    } catch (error: any) {
      console.error('Error creating creator page:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const updatePage = async (id: string, updates: Partial<CreatorPage>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('creator_pages')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Creator page updated successfully"
      });

      await fetchPages();
      return true;
    } catch (error: any) {
      console.error('Error updating creator page:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const deletePage = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('creator_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Creator page deleted successfully"
      });

      await fetchPages();
      return true;
    } catch (error: any) {
      console.error('Error deleting creator page:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const togglePublish = async (id: string, isPublished: boolean): Promise<boolean> => {
    return updatePage(id, { is_published: isPublished });
  };

  const checkSlugAvailability = async (slug: string, excludeId?: string): Promise<boolean> => {
    try {
      let query = supabase
        .from('creator_pages')
        .select('id')
        .eq('slug', slug);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data } = await query;
      return !data || data.length === 0;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchPages();
  }, [userId]);

  return {
    pages,
    loading,
    createPage,
    updatePage,
    deletePage,
    togglePublish,
    fetchPageBySlug,
    checkSlugAvailability,
    refetch: fetchPages
  };
};
