import { useState, useEffect, useCallback } from 'react';
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
  website_url?: string;
  contact_email?: string;
  followers_count: number;
  is_verified: boolean;
  is_official: boolean;
  created_at: string;
  updated_at: string;
  is_following?: boolean;
  user_role?: string | null;
}

export interface PageMember {
  id: string;
  page_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export const usePages = () => {
  const { user } = useAuth();
  const [pages, setPages] = useState<Page[]>([]);
  const [myPages, setMyPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('pages' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const pagesWithMeta = await Promise.all(
        ((data || []) as any[]).map(async (page: any) => {
          const { data: following } = await supabase
            .from('page_followers' as any)
            .select('id')
            .eq('page_id', page.id)
            .eq('user_id', user.id)
            .single();

          const { data: membership } = await supabase
            .from('page_members' as any)
            .select('role')
            .eq('page_id', page.id)
            .eq('user_id', user.id)
            .single();

          return {
            ...page,
            is_following: !!following,
            user_role: (membership as any)?.role || null,
          };
        })
      );

      setPages(pagesWithMeta as Page[]);
    } catch (err: any) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMyPages = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('page_members' as any)
        .select('page_id, role')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setMyPages([]);
        return;
      }

      const pageIds = (data as any[]).map((m: any) => m.page_id);
      const roles = Object.fromEntries((data as any[]).map((m: any) => [m.page_id, m.role]));

      const { data: pagesData, error: pagesError } = await supabase
        .from('pages' as any)
        .select('*')
        .in('id', pageIds);

      if (pagesError) throw pagesError;

      setMyPages(
        ((pagesData || []) as any[]).map((p: any) => ({
          ...p,
          user_role: roles[p.id] || null,
        })) as Page[]
      );
    } catch (err: any) {
      console.error('Failed to load my pages:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPages();
      fetchMyPages();
    }
  }, [user, fetchPages, fetchMyPages]);

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
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Success', description: 'Page created successfully!' });
      await fetchPages();
      await fetchMyPages();
      return data;
    } catch (err: any) {
      console.error('Failed to create page:', err);
      toast({ title: 'Error', description: err.message || 'Failed to create page', variant: 'destructive' });
      throw err;
    }
  };

  const updatePage = async (pageId: string, updates: Record<string, any>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('pages' as any)
        .update(updates as any)
        .eq('id', pageId);
      if (error) throw error;
      toast({ title: 'Page updated!' });
      await fetchPages();
      await fetchMyPages();
    } catch (err: any) {
      console.error('Failed to update page:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const followPage = async (pageId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('page_followers' as any)
        .insert({ page_id: pageId, user_id: user.id } as any);
      if (error) throw error;
      toast({ description: 'Following page' });
      await fetchPages();
    } catch (err: any) {
      console.error('Failed to follow page:', err);
      toast({ title: 'Error', description: 'Failed to follow page', variant: 'destructive' });
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
      toast({ description: 'Unfollowed page' });
      await fetchPages();
    } catch (err: any) {
      console.error('Failed to unfollow page:', err);
    }
  };

  const getPageByUsername = async (username: string): Promise<Page | null> => {
    try {
      const { data, error } = await supabase
        .from('pages' as any)
        .select('*')
        .eq('username', username)
        .single();
      if (error) throw error;

      if (user) {
        const { data: following } = await supabase
          .from('page_followers' as any)
          .select('id')
          .eq('page_id', (data as any).id)
          .eq('user_id', user.id)
          .single();

        const { data: membership } = await supabase
          .from('page_members' as any)
          .select('role')
          .eq('page_id', (data as any).id)
          .eq('user_id', user.id)
          .maybeSingle();

        return { ...(data as any), is_following: !!following, user_role: (membership as any)?.role || null } as Page;
      }

      return data as unknown as Page;
    } catch {
      return null;
    }
  };

  const getPagePosts = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('page_id', pageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Failed to load page posts:', err);
      return [];
    }
  };

  const createPagePost = async (pageId: string, postData: { content?: string; media_url?: string; media_type?: string; mediaFile?: File }) => {
    if (!user) return;
    try {
      let mediaUrl = postData.media_url;
      let mediaType = postData.media_type;

      // Upload media file if provided
      if (postData.mediaFile) {
        const file = postData.mediaFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(uploadData.path);
        mediaUrl = publicUrl;
        mediaType = file.type.startsWith('video/') ? 'video' : 'image';
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          page_id: pageId,
          content: postData.content,
          media_url: mediaUrl,
          media_type: mediaType,
          privacy: 'public',
        })
        .select()
        .single();
      if (error) throw error;
      toast({ title: 'Post published!' });
      return data;
    } catch (err: any) {
      console.error('Failed to create page post:', err);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      throw err;
    }
  };

  const getPageMembers = async (pageId: string): Promise<PageMember[]> => {
    try {
      const { data, error } = await supabase
        .from('page_members' as any)
        .select('*')
        .eq('page_id', pageId);
      if (error) throw error;
      return (data || []) as unknown as PageMember[];
    } catch {
      return [];
    }
  };

  return {
    pages,
    myPages,
    loading,
    createPage,
    updatePage,
    followPage,
    unfollowPage,
    getPageByUsername,
    getPagePosts,
    createPagePost,
    getPageMembers,
    refetch: () => {
      fetchPages();
      fetchMyPages();
    },
  };
};
