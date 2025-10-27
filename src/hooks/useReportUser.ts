import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export const useReportUser = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const reportUser = async (
    reportedUserId: string,
    reason: string,
    description?: string,
    chatId?: string,
    messageId?: string
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('reported_users')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason,
          description,
          chat_id: chatId,
          message_id: messageId,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.',
      });
      return true;
    } catch (error) {
      console.error('Error reporting user:', error);
      toast({
        title: 'Failed to submit report',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { reportUser, loading };
};
