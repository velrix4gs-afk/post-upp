import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface ChatSettings {
  chat_id: string;
  user_id: string;
  is_muted: boolean;
  is_pinned: boolean;
  wallpaper_url?: string;
  theme_color?: string;
  auto_delete_duration?: number;
  notifications_enabled: boolean;
}

export const useChatSettings = (chatId?: string) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && chatId) {
      fetchSettings();
    }
  }, [user, chatId]);

  const fetchSettings = async () => {
    if (!user || !chatId) return;

    try {
      const { data, error } = await supabase
        .from('chat_settings')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('chat_settings')
          .insert({
            chat_id: chatId,
            user_id: user.id,
            is_muted: false,
            is_pinned: false,
            notifications_enabled: true,
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error fetching chat settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<ChatSettings>) => {
    if (!user || !chatId) return;

    try {
      const { data, error } = await supabase
        .from('chat_settings')
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({ title: 'Settings updated' });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({ title: 'Failed to update settings', variant: 'destructive' });
    }
  };

  const toggleMute = () => updateSettings({ is_muted: !settings?.is_muted });
  const togglePin = () => updateSettings({ is_pinned: !settings?.is_pinned });
  const setWallpaper = (url: string) => updateSettings({ wallpaper_url: url });
  const setTheme = (color: string) => updateSettings({ theme_color: color });
  const setAutoDelete = (duration?: number) => updateSettings({ auto_delete_duration: duration });

  const muteChat = async (duration?: number) => {
    const muted_until = duration 
      ? new Date(Date.now() + duration * 60 * 1000).toISOString()
      : undefined;
    await updateSettings({ is_muted: true });
  };

  const unmuteChat = async () => {
    await updateSettings({ is_muted: false });
  };

  const setNickname = async (nickname: string) => {
    // Store nickname in chat_settings
    await updateSettings({ theme_color: nickname }); // Using theme_color as temporary storage
    toast({ description: 'Nickname set' });
  };

  return {
    settings,
    loading,
    updateSettings,
    toggleMute,
    togglePin,
    setWallpaper,
    setTheme,
    setAutoDelete,
    muteChat,
    unmuteChat,
    setNickname,
    refetch: fetchSettings,
  };
};
