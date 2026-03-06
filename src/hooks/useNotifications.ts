import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { CacheHelper } from '@/lib/asyncStorage';

export interface Notification {
  id: string;
  user_id: string;
  type: 'friend_request' | 'message' | 'like' | 'comment' | 'mention' | 'share' | 'follow' | 'voice_call' | 'video_call';
  title: string;
  content?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

const showBrowserNotification = (title: string, body?: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'post-upp-notification'
    });
  }
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      requestNotificationPermission();

      // Load cached notifications first for instant display
      CacheHelper.getNotifications().then(cached => {
        if (cached && cached.length > 0) {
          setNotifications(cached);
          setUnreadCount(cached.filter((n: Notification) => !n.is_read).length);
          setLoading(false);
        }
      });

      fetchNotifications();
      
      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => {
            const updated = [newNotification, ...prev];
            CacheHelper.saveNotifications(updated);
            return updated;
          });
          setUnreadCount(prev => prev + 1);
          
          toast(newNotification.title, {
            description: newNotification.content,
          });

          showBrowserNotification(
            newNotification.title,
            newNotification.content
          );
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          const updated = payload.new as Notification;
          setNotifications(prev => {
            const newList = prev.map(n => n.id === updated.id ? updated : n);
            CacheHelper.saveNotifications(newList);
            return newList;
          });
          // Recalculate unread
          setNotifications(prev => {
            setUnreadCount(prev.filter(n => !n.is_read).length);
            return prev;
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const notifs = (data || []) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
      CacheHelper.saveNotifications(notifs);
    } catch (err: any) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
        CacheHelper.saveNotifications(updated);
        return updated;
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, is_read: true }));
        CacheHelper.saveNotifications(updated);
        return updated;
      });
      setUnreadCount(0);
    } catch (err: any) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
};
