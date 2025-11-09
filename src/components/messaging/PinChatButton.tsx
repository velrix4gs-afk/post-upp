import { Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface PinChatButtonProps {
  chatId: string;
  isPinned: boolean;
  onTogglePin: () => void;
}

export const PinChatButton = ({ chatId, isPinned, onTogglePin }: PinChatButtonProps) => {
  const handleTogglePin = () => {
    onTogglePin();
    toast({ 
      description: isPinned ? 'Chat unpinned' : 'Chat pinned to top' 
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleTogglePin}
      className="gap-2"
    >
      <Pin className={`h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
      {isPinned ? 'Unpin Chat' : 'Pin Chat'}
    </Button>
  );
};
