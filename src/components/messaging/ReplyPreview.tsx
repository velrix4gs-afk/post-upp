import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReplyPreviewProps {
  content: string;
  senderName: string;
  onCancel: () => void;
}

export const ReplyPreview = ({ content, senderName, onCancel }: ReplyPreviewProps) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted border-l-4 border-primary">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-primary">{senderName}</div>
        <div className="text-sm text-muted-foreground truncate">{content}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full"
        onClick={onCancel}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
