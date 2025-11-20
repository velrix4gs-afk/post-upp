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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface GroupChatLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  chatName: string;
  userId: string;
}

export const GroupChatLeaveModal = ({
  open,
  onOpenChange,
  chatId,
  chatName,
  userId,
}: GroupChatLeaveModalProps) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      // Remove user from chat_participants
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({ title: `Left ${chatName}` });
      onOpenChange(false);
      navigate('/messages');
    } catch (error: any) {
      console.error('Error leaving chat:', error);
      toast({ 
        title: 'Failed to leave chat', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave Group Chat?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to leave "{chatName}"? You won't receive messages from this group anymore.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            disabled={isLeaving}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLeaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Leaving...
              </>
            ) : (
              'Leave Group'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
