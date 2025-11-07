import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Page {
  id: string;
  created_by: string;
  name: string;
  username: string;
  description?: string;
  category?: string;
  avatar_url?: string;
  cover_url?: string;
  followers_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  is_following?: boolean;
}

export const usePages = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [myPages, setMyPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPages();
      fetchMyPages();
    }
  }, [user]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pagesWithFollowing = await Promise.all(
        ((data || []) as any[]).map(async (page: any) => {
          const { data: following } = await supabase
            .from('page_followers' as any)
            .select('id')
            .eq('page_id', page.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...page,
            is_following: !!following
          };
        })
      );

      setPages(pagesWithFollowing as Page[]);
    } catch (err: any) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPages = async () => {
    try {
      const { data, error } = await supabase
        .from('pages' as any)
        .select('*')
        .eq('created_by', user?.id);

      if (error) throw error;

      setMyPages((data || []) as unknown as Page[]);
    } catch (err: any) {
      console.error('Failed to load my pages:', err);
    }
  };

  const createPage = async (pageData: {
    name: string;
    username: string;
    description?: string;
    category?: string;
    avatar?: File;
  }) => {
    if (!user) return;

    try {
      let avatar_url = null;

      if (pageData.avatar) {
        const fileExt = pageData.avatar.name.split('.').pop();
        const fileName = `pages/${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, pageData.avatar);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatar_url = publicUrl;
      }

      const { data, error } = await supabase
        .from('pages' as any)
        .insert({
          name: pageData.name,
          username: pageData.username,
          description: pageData.description,
          category: pageData.category,
          avatar_url,
          created_by: user.id
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Page created successfully!',
      });
      
      await fetchPages();
      await fetchMyPages();

      return data;
    } catch (err: any) {
      console.error('Failed to create page:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to create page',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const followPage = async (pageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('page_followers' as any)
        .insert({
          page_id: pageId,
          user_id: user.id
        } as any);

      if (error) throw error;

      toast({
        description: 'Following page',
      });

      await fetchPages();
    } catch (err: any) {
      console.error('Failed to follow page:', err);
      toast({
        title: 'Error',
        description: 'Failed to follow page',
        variant: 'destructive'
      });
    }
  };

  const unfollowPage = async (pageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('page_followers' as any)
        .delete()
        .eq('page_id', pageId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        description: 'Unfollowed page',
      });

      await fetchPages();
    } catch (err: any) {
      console.error('Failed to unfollow page:', err);
    }
  };

  return {
    pages,
    myPages,
    loading,
    createPage,
    followPage,
    unfollowPage,
    refetch: () => {
      fetchPages();
      fetchMyPages();
    }
  };
};