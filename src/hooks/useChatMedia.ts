import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface MediaItem {
  id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  sender_id: string;
}

export const useChatMedia = (chatId?: string) => {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && chatId) {
      fetchMedia();
    }
  }, [user, chatId]);

  const fetchMedia = async () => {
    if (!user || !chatId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, media_url, media_type, created_at, sender_id')
        .eq('chat_id', chatId)
        .not('media_url', 'is', null)
        .not('deleted_for', 'cs', `{${user.id}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMedia(data || []);
    } catch (error) {
      console.error('Error fetching chat media:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageMedia = () => media.filter(m => m.media_type?.startsWith('image'));
  const getVideoMedia = () => media.filter(m => m.media_type?.startsWith('video'));
  const getAudioMedia = () => media.filter(m => m.media_type?.startsWith('audio'));
  const getDocumentMedia = () => media.filter(m => 
    !m.media_type?.startsWith('image') && 
    !m.media_type?.startsWith('video') && 
    !m.media_type?.startsWith('audio')
  );

  return {
    media,
    loading,
    getImageMedia,
    getVideoMedia,
    getAudioMedia,
    getDocumentMedia,
    refetch: fetchMedia,
  };
};
