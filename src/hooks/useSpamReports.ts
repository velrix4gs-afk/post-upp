import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

type ContentType = 'post' | 'comment' | 'message' | 'user';

export const useSpamReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const reportContent = async (
    contentId: string,
    contentType: ContentType,
    reason: string
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('spam_reports')
        .insert({
          content_id: contentId,
          content_type: contentType,
          reporter_id: user.id,
          reason
        });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.'
      });
      
      return true;
    } catch (err: any) {
      toast({
        title: 'Failed to submit report',
        description: err.message,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    reportContent,
    loading
  };
};