import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useReportUser } from '@/hooks/useReportUser';

interface ReportUserDialogProps {
  userId: string;
  userName: string;
  chatId?: string;
  messageId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportUserDialog = ({
  userId,
  userName,
  chatId,
  messageId,
  open,
  onOpenChange,
}: ReportUserDialogProps) => {
  const { reportUser, loading } = useReportUser();
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');

  const handleReport = async () => {
    const success = await reportUser(userId, reason, description, chatId, messageId);
    if (success) {
      onOpenChange(false);
      setReason('spam');
      setDescription('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason for reporting</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam" className="font-normal">Spam or unwanted messages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="harassment" id="harassment" />
                <Label htmlFor="harassment" className="font-normal">Harassment or bullying</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="inappropriate" id="inappropriate" />
                <Label htmlFor="inappropriate" className="font-normal">Inappropriate content</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scam" id="scam" />
                <Label htmlFor="scam" className="font-normal">Scam or fraud</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide more context about why you're reporting this user..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleReport} disabled={loading} className="bg-destructive text-destructive-foreground">
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
