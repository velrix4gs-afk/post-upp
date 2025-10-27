import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Reply, Forward, Copy, Star, Edit, Trash2, Languages } from 'lucide-react';

interface MessageActionsMenuProps {
  children: React.ReactNode;
  isOwn: boolean;
  onReply: () => void;
  onForward: () => void;
  onCopy: () => void;
  onStar: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTranslate?: () => void;
}

export const MessageActionsMenu = ({
  children,
  isOwn,
  onReply,
  onForward,
  onCopy,
  onStar,
  onEdit,
  onDelete,
  onTranslate,
}: MessageActionsMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onForward}>
          <Forward className="mr-2 h-4 w-4" />
          Forward
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Text
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onStar}>
          <Star className="mr-2 h-4 w-4" />
          Star Message
        </ContextMenuItem>

        {onTranslate && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onTranslate}>
              <Languages className="mr-2 h-4 w-4" />
              Translate
            </ContextMenuItem>
          </>
        )}
        
        {isOwn && onEdit && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Message
            </ContextMenuItem>
          </>
        )}
        
        {isOwn && onDelete && (
          <ContextMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Message
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
