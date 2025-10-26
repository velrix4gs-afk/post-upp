import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface ChatSettings {
  id?: string;
  chat_id: string;
  user_id: string;
  is_muted: boolean;
  muted_until?: string;
  is_pinned: boolean;
  theme_color?: string;
  nickname?: string;
}

export const useChatSettings = (chatId: string | undefined) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ChatSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && chatId) {
      fetchSettings();
      fetchNickname();
    }
  }, [user, chatId]);

  const fetchSettings = async () => {
    if (!chatId || !user) return;

    try {
      const { data, error } = await supabase
        .from('chat_settings' as any)
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setSettings(data as any || {
        chat_id: chatId,
        user_id: user.id,
        is_muted: false,
        is_pinned: false
      });
    } catch (err) {
      console.error('Failed to load chat settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNickname = async () => {
    if (!chatId || !user) return;

    try {
      const { data } = await supabase
        .from('chat_nicknames' as any)
        .select('nickname')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();

      if (data && settings) {
        setSettings({ ...settings, nickname: (data as any).nickname });
      }
    } catch (err) {
      // Nickname doesn't exist yet, that's fine
    }
  };

  const updateSettings = async (updates: Partial<ChatSettings>) => {
    if (!chatId || !user) return;

    try {
      const { error } = await supabase
        .from('chat_settings' as any)
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          ...updates
        } as any);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...updates } : null);

      toast({
        description: 'Settings updated',
      });
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
  };

  const setNickname = async (nickname: string) => {
    if (!chatId || !user) return;

    try {
      const { error } = await supabase
        .from('chat_nicknames' as any)
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          nickname
        } as any);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, nickname } : null);

      toast({
        description: 'Nickname set',
      });
    } catch (err) {
      console.error('Failed to set nickname:', err);
      toast({
        title: 'Error',
        description: 'Failed to set nickname',
        variant: 'destructive'
      });
    }
  };

  const muteChat = async (duration?: number) => {
    const muted_until = duration 
      ? new Date(Date.now() + duration * 60 * 1000).toISOString()
      : undefined;

    await updateSettings({ is_muted: true, muted_until });
  };

  const unmuteChat = async () => {
    await updateSettings({ is_muted: false, muted_until: undefined });
  };

  const togglePin = async () => {
    await updateSettings({ is_pinned: !settings?.is_pinned });
  };

  const setTheme = async (theme_color: string) => {
    await updateSettings({ theme_color });
  };

  return {
    settings,
    loading,
    updateSettings,
    setNickname,
    muteChat,
    unmuteChat,
    togglePin,
    setTheme
  };
};