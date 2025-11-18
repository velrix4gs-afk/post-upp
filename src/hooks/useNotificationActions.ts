import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useNotificationActions = () => {
  const { user } = useAuth();
  const [clearedNotifications, setClearedNotifications] = useState<Set<string>>(new Set());

  const markAsRead = async (notificationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications_read')
        .upsert({
          user_id: user.id,
          notification_id: notificationId,
          read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,notification_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  };

  const clearNotification = async (notificationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications_read')
        .upsert({
          user_id: user.id,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
          cleared_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,notification_id'
        });

      if (error) throw error;
      
      setClearedNotifications(prev => new Set(prev).add(notificationId));
      
      toast({
        title: "Notification Cleared",
        description: "Notification removed from list",
        duration: 1000
      });
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return false;

    try {
      // Get all notification IDs for the user
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id);

      if (!notifications) return false;

      // Mark all as cleared
      const inserts = notifications.map(n => ({
        user_id: user.id,
        notification_id: n.id,
        read_at: new Date().toISOString(),
        cleared_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('notifications_read')
        .upsert(inserts, {
          onConflict: 'user_id,notification_id'
        });

      if (error) throw error;
      
      setClearedNotifications(new Set(notifications.map(n => n.id)));
      
      toast({
        title: "All Cleared",
        description: "All notifications have been cleared",
        duration: 1000
      });
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const isNotificationCleared = (notificationId: string) => {
    return clearedNotifications.has(notificationId);
  };

  return {
    markAsRead,
    clearNotification,
    clearAllNotifications,
    isNotificationCleared
  };
};
