import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DisappearingMessagesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
}

export const DisappearingMessagesDialog = ({ isOpen, onClose, chatId }: DisappearingMessagesDialogProps) => {
  const [duration, setDuration] = useState<string>('off');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in',
          variant: 'destructive',
        });
        return;
      }

      // Save to database
      const autoDurationSeconds = duration === 'off' ? null : parseInt(duration) * 60;
      
      const { error } = await supabase
        .from('chat_settings')
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          auto_delete_duration: autoDurationSeconds
        });

      if (error) {
        throw error;
      }

      toast({
        title: duration === 'off' ? 'Disappearing messages disabled' : 'Disappearing messages enabled',
        description: duration === 'off' 
          ? 'Messages will not auto-delete' 
          : `Messages will auto-delete after ${duration} minutes`,
      });
      onClose();
    } catch (error) {
      console.error('Error saving disappearing messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disappearing Messages</DialogTitle>
          <DialogDescription>
            Set messages to auto-delete after a specific time
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Auto-delete after</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="1440">24 hours</SelectItem>
                <SelectItem value="10080">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};