import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSpamReports } from '@/hooks/useSpamReports';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentType: 'post' | 'comment' | 'message' | 'user';
}

export const ReportDialog = ({ open, onOpenChange, contentId, contentType }: ReportDialogProps) => {
  const { reportContent, loading } = useSpamReports();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const reasons = [
    'Spam or misleading',
    'Harassment or hate speech',
    'Violence or dangerous content',
    'Sexual content',
    'False information',
    'Other'
  ];

  const handleSubmit = async () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (!reason.trim()) return;

    const success = await reportContent(contentId, contentType, reason);
    if (success) {
      onOpenChange(false);
      setSelectedReason('');
      setCustomReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Help us understand what's happening with this {contentType}.
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
          {reasons.map(reason => (
            <div key={reason} className="flex items-center space-x-2">
              <RadioGroupItem value={reason} id={reason} />
              <Label htmlFor={reason} className="cursor-pointer">{reason}</Label>
            </div>
          ))}
        </RadioGroup>

        {selectedReason === 'Other' && (
          <Textarea
            placeholder="Please describe the issue..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="min-h-[100px]"
          />
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || (selectedReason === 'Other' && !customReason.trim()) || loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};