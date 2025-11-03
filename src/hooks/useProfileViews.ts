import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useProfileViews = (profileId?: string) => {
  const { user } = useAuth();
  const [viewCount, setViewCount] = useState(0);
  const [recentViewers, setRecentViewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profileId) {
      fetchViews();
      recordView();
    }
  }, [profileId, user]);

  const fetchViews = async () => {
    if (!profileId) return;

    try {
      // Get total view count
      const { count } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', profileId);

      setViewCount(count || 0);

      // Get recent viewers (only if viewing own profile)
      if (user?.id === profileId) {
        const { data: viewers } = await supabase
          .from('profile_views')
          .select(`
            id,
            viewed_at,
            viewer:viewer_id (
              id,
              display_name,
              username,
              avatar_url
            )
          `)
          .eq('profile_id', profileId)
          .not('viewer_id', 'is', null)
          .order('viewed_at', { ascending: false })
          .limit(10);

        setRecentViewers(viewers || []);
      }
    } catch (error) {
      console.error('Error fetching profile views:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    if (!profileId || !user || user.id === profileId) return;

    try {
      await supabase
        .from('profile_views')
        .insert({
          profile_id: profileId,
          viewer_id: user.id
        });
    } catch (error) {
      console.error('Error recording profile view:', error);
    }
  };

  return {
    viewCount,
    recentViewers,
    loading,
    refetch: fetchViews
  };
};
