import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';
import { cache, STORES } from '@/lib/cache';

export interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
  duration?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  creator_name?: string;
  creator_avatar?: string;
  is_verified?: boolean;
  is_liked?: boolean;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  created_at: string;
  user?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useReels = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchReels = async (reset = false) => {
    if (!user || loading) return;
    
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;

      // Try cache first
      const cacheKey = `reels_${currentPage}`;
      const cachedData = await cache.get(STORES.REELS, cacheKey);
      
      if (cachedData && !reset) {
        setReels([...reels, ...(cachedData as Reel[])]);
        setPage(prev => prev + 1);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_recommended_reels', {
        p_user_id: user.id,
        p_page_offset: currentPage * 10,
        p_page_size: 10
      });

      if (error) throw error;

      if (data && data.length > 0) {
        // Check which reels user has liked
        const reelIds = data.map((r: any) => r.id);
        const { data: likedReels } = await supabase
          .from('reel_reactions')
          .select('reel_id')
          .eq('user_id', user.id)
          .in('reel_id', reelIds);

        const likedSet = new Set(likedReels?.map(r => r.reel_id) || []);

        const reelsWithLikes = data.map((r: any) => ({
          ...r,
          is_liked: likedSet.has(r.id)
        }));

        // Cache the results
        await cache.set(STORES.REELS, cacheKey, reelsWithLikes);

        if (reset) {
          setReels(reelsWithLikes);
          setPage(1);
        } else {
          setReels(prev => [...prev, ...reelsWithLikes]);
          setPage(prev => prev + 1);
        }

        setHasMore(data.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Error fetching reels:', error);
      toast({
        title: 'Failed to load reels',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createReel = async (videoFile: File, caption?: string) => {
    if (!user) return null;

    try {
      // Get video duration
      const duration = await getVideoDuration(videoFile);

      // Upload video
      const videoPath = `${user.id}/${Date.now()}_${videoFile.name}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('reels')
        .upload(videoPath, videoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('reels')
        .getPublicUrl(videoPath);

      // Create reel record
      const { data: reel, error: insertError } = await supabase
        .from('reels')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          caption,
          duration: Math.floor(duration)
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Extract and save hashtags for interests
      if (caption) {
        const hashtags = caption.match(/#\w+/g);
        if (hashtags) {
          for (const tag of hashtags) {
            await supabase.from('user_reel_interests').upsert({
              user_id: user.id,
              hashtag: tag.toLowerCase(),
              interest_score: 1
            }, {
              onConflict: 'user_id,hashtag'
            });
          }
        }
      }

      toast({
        title: 'Reel created!',
        description: 'Your reel has been posted successfully'
      });

      return reel;
    } catch (error: any) {
      console.error('Error creating reel:', error);
      toast({
        title: 'Failed to create reel',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const viewReel = async (reelId: string, watchDuration: number, completed: boolean) => {
    if (!user) return;

    try {
      // Record view
      await supabase.from('reel_views').upsert({
        reel_id: reelId,
        user_id: user.id,
        watch_duration: watchDuration,
        completed
      }, {
        onConflict: 'reel_id,user_id'
      });

      // Increment view count
      await supabase.rpc('increment_reel_views', { reel_id: reelId });

      // Update local state
      setReels(prev => prev.map(r => 
        r.id === reelId ? { ...r, views_count: r.views_count + 1 } : r
      ));

      // Track interest if completed
      if (completed) {
        const reel = reels.find(r => r.id === reelId);
        if (reel) {
          await supabase.from('user_reel_interests').upsert({
            user_id: user.id,
            creator_id: reel.user_id,
            interest_score: 1
          }, {
            onConflict: 'user_id,creator_id'
          });
        }
      }
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const likeReel = async (reelId: string) => {
    if (!user) return;

    try {
      const reel = reels.find(r => r.id === reelId);
      if (!reel) return;

      if (reel.is_liked) {
        // Unlike
        await supabase
          .from('reel_reactions')
          .delete()
          .eq('reel_id', reelId)
          .eq('user_id', user.id);

        setReels(prev => prev.map(r =>
          r.id === reelId
            ? { ...r, is_liked: false, likes_count: r.likes_count - 1 }
            : r
        ));
      } else {
        // Like
        await supabase.from('reel_reactions').insert({
          reel_id: reelId,
          user_id: user.id,
          reaction_type: 'like'
        });

        setReels(prev => prev.map(r =>
          r.id === reelId
            ? { ...r, is_liked: true, likes_count: r.likes_count + 1 }
            : r
        ));
      }
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Failed to like reel',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const fetchComments = async (reelId: string) => {
    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .select(`
          *,
          user:profiles(display_name, avatar_url)
        `)
        .eq('reel_id', reelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReelComment[];
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const addComment = async (reelId: string, content: string, parentId?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .insert({
          reel_id: reelId,
          user_id: user.id,
          content,
          parent_id: parentId
        })
        .select()
        .single();

      if (error) throw error;

      // Update comments count
      setReels(prev => prev.map(r =>
        r.id === reelId ? { ...r, comments_count: r.comments_count + 1 } : r
      ));

      return data;
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Failed to add comment',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    }
  };

  const deleteReel = async (reelId: string) => {
    if (!user) return;

    try {
      const reel = reels.find(r => r.id === reelId);
      if (!reel || reel.user_id !== user.id) return;

      // Delete from storage
      const path = reel.video_url.split('/reels/')[1];
      if (path) {
        await supabase.storage.from('reels').remove([path]);
      }

      // Delete from database
      await supabase.from('reels').delete().eq('id', reelId);

      setReels(prev => prev.filter(r => r.id !== reelId));

      toast({
        title: 'Reel deleted',
        description: 'Your reel has been removed'
      });
    } catch (error: any) {
      console.error('Error deleting reel:', error);
      toast({
        title: 'Failed to delete reel',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  useEffect(() => {
    if (user) {
      fetchReels(true);
    }
  }, [user]);

  return {
    reels,
    loading,
    hasMore,
    fetchReels,
    createReel,
    viewReel,
    likeReel,
    fetchComments,
    addComment,
    deleteReel
  };
};
