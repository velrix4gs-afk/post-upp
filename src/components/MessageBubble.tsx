import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit2, Trash2, Reply, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

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
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  onReply?: () => void;
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
  onEdit,
  onDelete,
  onReply,
}: MessageBubbleProps) => {
  return (
    <div className={cn(
      "flex gap-2 md:gap-3 group mb-2 md:mb-4",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-7 w-7 md:h-8 md:w-8 flex-shrink-0">
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

        <div className="flex items-start gap-1 md:gap-2">
          <div
            className={cn(
              "rounded-2xl px-3 py-2 md:px-4 shadow-sm",
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted rounded-tl-sm"
            )}
          >
            {mediaUrl && (
              <div className="mb-2">
                {mediaType?.startsWith('image/') ? (
                  <img 
                    src={mediaUrl} 
                    alt="Message attachment" 
                    className="rounded-lg max-w-full max-h-48 md:max-h-64 cursor-pointer hover:opacity-90"
                    onClick={() => window.open(mediaUrl, '_blank')}
                  />
                ) : mediaType?.startsWith('audio/') ? (
                  <audio controls src={mediaUrl} className="max-w-full" />
                ) : null}
              </div>
            )}
            {content && (
              <p className="text-xs md:text-sm break-words whitespace-pre-wrap">
                {content}
                {isEdited && (
                  <span className="text-xs opacity-70 ml-2">(edited)</span>
                )}
              </p>
            )}
          </div>
          
          {(onEdit || onDelete || onReply) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 md:h-6 md:w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                {onReply && (
                  <DropdownMenuItem onClick={onReply} className="text-xs md:text-sm">
                    <Reply className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(content)} className="text-xs md:text-sm">
                  <Copy className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                {isOwn && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(id, content)} className="text-xs md:text-sm">
                    <Edit2 className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {isOwn && onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(id)}
                    className="text-xs md:text-sm text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <span className="text-xs text-muted-foreground mt-0.5 md:mt-1 px-2 md:px-3">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
};