import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ScheduleMessageDialogProps {
  chatId: string;
  content: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled: () => void;
}

export const ScheduleMessageDialog = ({
  chatId,
  content,
  open,
  onOpenChange,
  onScheduled,
}: ScheduleMessageDialogProps) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('12:00');
  const [loading, setLoading] = useState(false);

  const handleSchedule = async () => {
    if (!user || !date) return;

    setLoading(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const scheduledDate = new Date(date);
      scheduledDate.setHours(hours, minutes, 0, 0);

      if (scheduledDate <= new Date()) {
        toast({ title: 'Please select a future date and time', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('scheduled_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content,
          scheduled_for: scheduledDate.toISOString(),
        });

      if (error) throw error;

      toast({ title: 'Message scheduled successfully' });
      onScheduled();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling message:', error);
      toast({ title: 'Failed to schedule message', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Select Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Message:</p>
            <p className="text-sm mt-1">{content}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
