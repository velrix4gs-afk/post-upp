import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit2, Trash2, Reply, Copy, Star, Forward } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { MessageReactions } from "./messaging/MessageReactions";
import { ReadReceiptIndicator } from "./messaging/ReadReceiptIndicator";
import { ReactionPicker } from "./ReactionPicker";
import { Badge } from "./ui/badge";

interface MessageBubbleProps {
  id: string;
  content: string;
  sender: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  timestamp: string;
  isOwn: boolean;
  mediaUrl?: string;
  mediaType?: string;
  isEdited?: boolean;
  isForwarded?: boolean;
  isStarred?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: Array<{
    type: string;
    count: number;
    users: { id: string; name: string }[];
    hasReacted: boolean;
  }>;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReply?: () => void;
  onReact?: (id: string, reaction: string) => void;
  onUnreact?: (id: string, reaction: string) => void;
  onStar?: (id: string) => void;
  onUnstar?: (id: string) => void;
  onForward?: (id: string) => void;
}

export const MessageBubble = ({
  id,
  content,
  sender,
  timestamp,
  isOwn,
  mediaUrl,
  mediaType,
  isEdited = false,
  isForwarded = false,
  isStarred = false,
  status = 'sent',
  reactions = [],
  onEdit,
  onDelete,
  onReply,
  onReact,
  onUnreact,
  onStar,
  onUnstar,
  onForward,
}: MessageBubbleProps) => {
  return (
    <div className={cn(
      "flex gap-2 md:gap-3 group mb-3 md:mb-4",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-9 w-9 md:h-8 md:w-8 flex-shrink-0">
        <AvatarImage src={sender.avatar_url} alt={sender.display_name} />
        <AvatarFallback>{sender.display_name[0]}</AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col max-w-[85%] md:max-w-[70%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {!isOwn && (
          <span className="text-xs text-muted-foreground mb-1 px-2 md:px-3">
            {sender.display_name}
          </span>
        )}

        {isForwarded && (
          <Badge variant="secondary" className="mb-1 text-xs">
            <Forward className="h-3 w-3 mr-1" />
            Forwarded
          </Badge>
        )}

        <div className="flex items-start gap-1 md:gap-2">
          <div
            className={cn(
              "rounded-2xl px-3 py-2 md:px-4 shadow-sm relative",
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted rounded-tl-sm"
            )}
          >
            {isStarred && (
              <Star className="absolute -top-2 -right-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
            )}
            
            {mediaUrl && (
              <div className="mb-2">
                {mediaType?.startsWith('image/') ? (
                  <img 
                    src={mediaUrl} 
                    alt="Message attachment" 
                    className="rounded-lg max-w-full max-h-48 md:max-h-64 cursor-pointer hover:opacity-90 active:opacity-80"
                    onClick={() => window.open(mediaUrl, '_blank')}
                  />
                ) : mediaType?.startsWith('audio/') ? (
                  <audio controls src={mediaUrl} className="max-w-full" />
                ) : null}
              </div>
            )}
            {content && (
              <p className="text-sm md:text-base break-words whitespace-pre-wrap">
                {content}
                {isEdited && (
                  <span className="text-xs opacity-70 ml-2">(edited)</span>
                )}
              </p>
            )}
          </div>
          
          {(onEdit || onDelete || onReply || onReact || onStar || onForward) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 md:h-6 md:w-6 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"} className="min-w-[160px]">
                {onReact && (
                  <div className="p-2 flex items-center gap-1">
                    <ReactionPicker onReact={(reaction) => onReact(id, reaction)} />
                    <span className="text-xs text-muted-foreground ml-2">React</span>
                  </div>
                )}
                {onReact && <DropdownMenuSeparator />}
                {onReply && (
                  <DropdownMenuItem onClick={onReply} className="py-3 md:py-2">
                    <Reply className="h-4 w-4 mr-3" />
                    Reply
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(content)} className="py-3 md:py-2">
                  <Copy className="h-4 w-4 mr-3" />
                  Copy
                </DropdownMenuItem>
                {onForward && (
                  <DropdownMenuItem onClick={() => onForward(id)} className="py-3 md:py-2">
                    <Forward className="h-4 w-4 mr-3" />
                    Forward
                  </DropdownMenuItem>
                )}
                {(onStar || onUnstar) && (
                  <DropdownMenuItem 
                    onClick={() => isStarred ? onUnstar?.(id) : onStar?.(id)} 
                    className="py-3 md:py-2"
                  >
                    <Star className={cn("h-4 w-4 mr-3", isStarred && "fill-yellow-500 text-yellow-500")} />
                    {isStarred ? 'Unstar' : 'Star'}
                  </DropdownMenuItem>
                )}
                {(onStar || onUnstar) && <DropdownMenuSeparator />}
                {isOwn && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id, content)} className="py-3 md:py-2">
                    <Edit2 className="h-4 w-4 mr-3" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwn && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(id)}
                    className="text-destructive focus:text-destructive py-3 md:py-2"
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {onReact && onUnreact && (
          <MessageReactions
            reactions={reactions}
            onReact={(type) => onReact(id, type)}
            onUnreact={(type) => onUnreact(id, type)}
          />
        )}

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 px-2 md:px-3">
          <span>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
          {isOwn && <ReadReceiptIndicator status={status} isOwn={isOwn} />}
        </div>
      </div>
    </div>
  );
};
