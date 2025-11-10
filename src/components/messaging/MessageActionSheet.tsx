import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Reply,
  Forward,
  Copy,
  Star,
  Edit,
  Trash2,
  SmilePlus,
  Pin,
  Download,
  Info,
  Clock,
} from 'lucide-react';

interface MessageActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwn: boolean;
  isStarred: boolean;
  onReply?: () => void;
  onForward?: () => void;
  onCopy?: () => void;
  onStar?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: () => void;
  onPin?: () => void;
  onDownload?: () => void;
  onInfo?: () => void;
  onSchedule?: () => void;
}

export const MessageActionSheet = ({
  open,
  onOpenChange,
  isOwn,
  isStarred,
  onReply,
  onForward,
  onCopy,
  onStar,
  onEdit,
  onDelete,
  onReact,
  onPin,
  onDownload,
  onInfo,
  onSchedule,
}: MessageActionSheetProps) => {
  const handleAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-xl">
        <SheetHeader>
          <SheetTitle>Message Actions</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {onReply && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onReply)}
            >
              <Reply className="h-5 w-5" />
              <span className="text-xs">Reply</span>
            </Button>
          )}

          {onForward && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onForward)}
            >
              <Forward className="h-5 w-5" />
              <span className="text-xs">Forward</span>
            </Button>
          )}

          {onCopy && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onCopy)}
            >
              <Copy className="h-5 w-5" />
              <span className="text-xs">Copy</span>
            </Button>
          )}

          {onStar && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onStar)}
            >
              <Star className={`h-5 w-5 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              <span className="text-xs">{isStarred ? 'Unstar' : 'Star'}</span>
            </Button>
          )}

          {onReact && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onReact)}
            >
              <SmilePlus className="h-5 w-5" />
              <span className="text-xs">React</span>
            </Button>
          )}

          {onPin && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onPin)}
            >
              <Pin className="h-5 w-5" />
              <span className="text-xs">Pin</span>
            </Button>
          )}

          {isOwn && onEdit && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onEdit)}
            >
              <Edit className="h-5 w-5" />
              <span className="text-xs">Edit</span>
            </Button>
          )}

          {isOwn && onDelete && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2 text-destructive"
              onClick={() => handleAction(onDelete)}
            >
              <Trash2 className="h-5 w-5" />
              <span className="text-xs">Delete</span>
            </Button>
          )}

          {onDownload && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onDownload)}
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">Download</span>
            </Button>
          )}

          {onInfo && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onInfo)}
            >
              <Info className="h-5 w-5" />
              <span className="text-xs">Info</span>
            </Button>
          )}

          {isOwn && onSchedule && (
            <Button
              variant="ghost"
              className="flex flex-col h-auto py-4 gap-2"
              onClick={() => handleAction(onSchedule)}
            >
              <Clock className="h-5 w-5" />
              <span className="text-xs">Schedule</span>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
