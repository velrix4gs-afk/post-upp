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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface ClearChatDialogProps {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleared: () => void;
}

export const ClearChatDialog = ({ chatId, open, onOpenChange, onCleared }: ClearChatDialogProps) => {
  const { user } = useAuth();

  const handleClear = async () => {
    if (!user) return;

    try {
      // Soft delete: add user to deleted_for array
      const { data: messages } = await supabase
        .from('messages')
        .select('id, deleted_for')
        .eq('chat_id', chatId);

      if (messages) {
        for (const message of messages) {
          const deletedFor = message.deleted_for || [];
          if (!deletedFor.includes(user.id)) {
            await supabase
              .from('messages')
              .update({
                deleted_for: [...deletedFor, user.id],
              })
              .eq('id', message.id);
          }
        }
      }

      toast({ title: 'Chat history cleared' });
      onCleared();
      onOpenChange(false);
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast({ title: 'Failed to clear chat', variant: 'destructive' });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear all messages from this chat for you. Other participants will still see the messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} className="bg-destructive text-destructive-foreground">
            Clear Chat
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
