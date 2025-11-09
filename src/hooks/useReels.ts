import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string | null;
    username: string;
  };
  is_liked?: boolean;
}

export const useReels = () => {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reels')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Check which reels the user has liked
      if (user) {
        const { data: likes } = await supabase
          .from('reel_likes')
          .select('reel_id')
          .eq('user_id', user.id);

        const likedReelIds = new Set(likes?.map(l => l.reel_id) || []);
        
        setReels((data || []).map(reel => ({
          ...reel,
          is_liked: likedReelIds.has(reel.id)
        })));
      } else {
        setReels(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching reels:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createReel = async (videoFile: File, caption?: string, thumbnailFile?: File) => {
    if (!user) return;

    try {
      // Upload video
      const videoPath = `${user.id}/${Date.now()}_${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(videoPath, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: videoUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(videoPath);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbPath = `${user.id}/${Date.now()}_thumb_${thumbnailFile.name}`;
        const { error: thumbError } = await supabase.storage
          .from('posts')
          .upload(thumbPath, thumbnailFile);

        if (!thumbError) {
          const { data: { publicUrl } } = supabase.storage
            .from('posts')
            .getPublicUrl(thumbPath);
          thumbnailUrl = publicUrl;
        }
      }

      // Create reel record
      const { error: insertError } = await supabase
        .from('reels')
        .insert({
          user_id: user.id,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          caption: caption || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Reel posted successfully!',
      });

      fetchReels();
    } catch (error: any) {
      console.error('Error creating reel:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create reel',
        variant: 'destructive',
      });
    }
  };

  const trackView = async (reelId: string) => {
    try {
      await supabase.rpc('increment_reel_views', { reel_id: reelId });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const toggleLike = async (reelId: string) => {
    if (!user) return;

    try {
      const reel = reels.find(r => r.id === reelId);
      if (!reel) return;

      if (reel.is_liked) {
        // Unlike
        const { error } = await supabase
          .from('reel_likes')
          .delete()
          .eq('reel_id', reelId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('reel_likes')
          .insert({ reel_id: reelId, user_id: user.id });

        if (error) throw error;
      }

      // Update local state
      setReels(reels.map(r => 
        r.id === reelId 
          ? { 
              ...r, 
              is_liked: !r.is_liked,
              likes_count: r.is_liked ? r.likes_count - 1 : r.likes_count + 1
            }
          : r
      ));
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    }
  };

  const deleteReel = async (reelId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reels')
        .delete()
        .eq('id', reelId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Reel deleted successfully',
      });

      fetchReels();
    } catch (error: any) {
      console.error('Error deleting reel:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete reel',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchReels();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('reels_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reels' }, () => {
        fetchReels();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    reels,
    loading,
    createReel,
    trackView,
    toggleLike,
    deleteReel,
    refetch: fetchReels,
  };
};
