import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';

interface BlockUserDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BlockUserDialog = ({ userId, userName, open, onOpenChange }: BlockUserDialogProps) => {
  const { blockUser } = useBlockedUsers();
  const [reason, setReason] = useState('');

  const handleBlock = async () => {
    await blockUser(userId, reason);
    onOpenChange(false);
    setReason('');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block {userName}?</AlertDialogTitle>
          <AlertDialogDescription>
            They won't be able to message you or see your profile. They won't be notified that you blocked them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="Why are you blocking this user?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-2"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleBlock} className="bg-destructive text-destructive-foreground">
            Block User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
