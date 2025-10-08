import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit2, Trash2, Reply, Copy, Star, Forward, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { ReactionPicker } from "./ReactionPicker";

interface MessageReaction {
  user_id: string;
  reaction_type: string;
}

interface EnhancedMessageBubbleProps {
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
  status?: 'sent' | 'delivered' | 'read';
  reactions?: MessageReaction[];
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string, deleteFor: 'me' | 'everyone') => void;
  onReply?: () => void;
  onReact?: (messageId: string, reaction: string) => void;
  onUnreact?: (messageId: string) => void;
  onStar?: (messageId: string) => void;
  onUnstar?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
}

export const EnhancedMessageBubble = ({
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
}: EnhancedMessageBubbleProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteFor, setDeleteFor] = useState<'me' | 'everyone'>('me');

  const handleDelete = () => {
    onDelete?.(id, deleteFor);
    setShowDeleteDialog(false);
  };

  // Group reactions by type and count
  const reactionGroups = reactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasUserReacted = reactions.some(r => r.user_id === 'current-user'); // Replace with actual user check

  return (
    <>
      <div className={cn(
        "flex gap-3 group mb-4 relative",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender.avatar_url} alt={sender.display_name} />
          <AvatarFallback>{sender.display_name[0]}</AvatarFallback>
        </Avatar>
        
        <div className={cn(
          "flex flex-col max-w-[70%]",
          isOwn ? "items-end" : "items-start"
        )}>
          {!isOwn && (
            <span className="text-xs text-muted-foreground mb-1 px-3">
              {sender.display_name}
            </span>
          )}

          <div className="flex items-start gap-2">
            <div className="relative">
              {isStarred && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
              )}
              
              <div
                className={cn(
                  "rounded-2xl px-4 py-2 shadow-sm",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                )}
              >
                {isForwarded && (
                  <div className="text-xs opacity-70 mb-1 flex items-center gap-1">
                    <Forward className="h-3 w-3" />
                    Forwarded
                  </div>
                )}
                
                {mediaUrl && (
                  <div className="mb-2">
                    {mediaType?.startsWith('image/') ? (
                      <img 
                        src={mediaUrl} 
                        alt="Message attachment" 
                        className="rounded-lg max-w-full max-h-64 cursor-pointer hover:opacity-90"
                        onClick={() => window.open(mediaUrl, '_blank')}
                      />
                    ) : mediaType?.startsWith('audio/') ? (
                      <audio controls src={mediaUrl} className="max-w-full" />
                    ) : null}
                  </div>
                )}
                
                {content && (
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {content}
                    {isEdited && (
                      <span className="text-xs opacity-70 ml-2">(edited)</span>
                    )}
                  </p>
                )}

                {/* Message status for own messages */}
                {isOwn && (
                  <div className="flex justify-end items-center gap-1 mt-1">
                    {status === 'read' && <CheckCheck className="h-3 w-3 text-blue-500" />}
                    {status === 'delivered' && <CheckCheck className="h-3 w-3" />}
                    {status === 'sent' && <CheckCheck className="h-3 w-3 opacity-50" />}
                  </div>
                )}
              </div>

              {/* Reactions display */}
              {Object.keys(reactionGroups).length > 0 && (
                <div className="absolute -bottom-2 left-2 flex gap-1">
                  {Object.entries(reactionGroups).map(([reaction, count]) => (
                    <Badge
                      key={reaction}
                      variant="secondary"
                      className="h-5 px-1.5 text-xs cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => hasUserReacted ? onUnreact?.(id) : onReact?.(id, reaction)}
                    >
                      {reaction} {count > 1 && count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onReact && (
                <ReactionPicker onReact={(reaction) => onReact(id, reaction)} />
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"}>
                  {onReply && (
                    <DropdownMenuItem onClick={onReply}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(content)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>

                  {onForward && (
                    <DropdownMenuItem onClick={() => onForward(id)}>
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </DropdownMenuItem>
                  )}

                  {(onStar || onUnstar) && (
                    <DropdownMenuItem onClick={() => isStarred ? onUnstar?.(id) : onStar?.(id)}>
                      <Star className={cn("h-4 w-4 mr-2", isStarred && "fill-yellow-400 text-yellow-400")} />
                      {isStarred ? 'Unstar' : 'Star'}
                    </DropdownMenuItem>
                  )}

                  {isOwn && onEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(id, content)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          setDeleteFor('me');
                          setShowDeleteDialog(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete for me
                      </DropdownMenuItem>
                      
                      {isOwn && (
                        <DropdownMenuItem 
                          onClick={() => {
                            setDeleteFor('everyone');
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete for everyone
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <span className="text-xs text-muted-foreground mt-1 px-3">
            {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFor === 'everyone' 
                ? 'This message will be deleted for everyone in this chat.'
                : 'This message will be deleted for you only.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
