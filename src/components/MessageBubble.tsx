import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Reply, 
  Forward, 
  Copy, 
  Trash2, 
  MoreVertical,
  Check,
  CheckCheck,
  Volume2,
  Play,
  Pause
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isSent: boolean;
  isRead?: boolean;
  isDelivered?: boolean;
  mediaUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  replyTo?: {
    content: string;
    sender: string;
  };
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
  isForwarded?: boolean;
  onReply?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
}

const MessageBubble = ({
  id,
  content,
  sender,
  timestamp,
  isSent,
  isRead,
  isDelivered,
  mediaUrl,
  voiceUrl,
  voiceDuration,
  replyTo,
  reactions = [],
  isForwarded,
  onReply,
  onForward,
  onDelete,
  onReact
}: MessageBubbleProps) => {
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const quickEmojis = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

  const handleEmojiClick = (emoji: string) => {
    onReact?.(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className={cn(
      "flex gap-2 mb-3 group",
      isSent ? "justify-end" : "justify-start"
    )}>
      {!isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback>{sender.name[0]}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        "flex flex-col max-w-[70%]",
        isSent ? "items-end" : "items-start"
      )}>
        {!isSent && (
          <span className="text-xs text-muted-foreground mb-1 px-3">{sender.name}</span>
        )}

        <div className="relative">
          {/* Message Bubble */}
          <div className={cn(
            "rounded-2xl px-4 py-2 shadow-sm relative",
            isSent 
              ? "bg-primary text-primary-foreground rounded-tr-sm" 
              : "bg-muted rounded-tl-sm"
          )}>
            {isForwarded && (
              <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                <Forward className="h-3 w-3" />
                <span>Forwarded</span>
              </div>
            )}

            {replyTo && (
              <div className={cn(
                "border-l-2 pl-2 mb-2 text-xs opacity-80",
                isSent ? "border-primary-foreground/30" : "border-primary/30"
              )}>
                <div className="font-semibold">{replyTo.sender}</div>
                <div className="truncate">{replyTo.content}</div>
              </div>
            )}

            {mediaUrl && (
              <img 
                src={mediaUrl} 
                alt="Message media" 
                className="rounded-lg mb-2 max-w-xs cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(mediaUrl, '_blank')}
              />
            )}

            {voiceUrl && (
              <div className="flex items-center gap-2 min-w-[200px]">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    // TODO: Implement voice playback
                    setIsPlayingVoice(!isPlayingVoice);
                  }}
                >
                  {isPlayingVoice ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <div className="flex-1 h-8 bg-primary/20 rounded-full flex items-center px-2">
                  <Volume2 className="h-3 w-3 mr-2" />
                  <div className="flex-1 h-1 bg-primary/40 rounded-full">
                    <div className="h-full w-1/3 bg-primary rounded-full" />
                  </div>
                </div>
                <span className="text-xs">{voiceDuration}s</span>
              </div>
            )}

            {content && <p className="break-words">{content}</p>}

            <div className={cn(
              "flex items-center gap-1 mt-1 text-xs opacity-70",
              isSent ? "justify-end" : "justify-start"
            )}>
              <span>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
              {isSent && (
                <>
                  {isRead ? (
                    <CheckCheck className="h-3 w-3 text-blue-400" />
                  ) : isDelivered ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className={cn(
              "absolute -bottom-2 flex gap-1 bg-background border rounded-full px-2 py-0.5 shadow-sm",
              isSent ? "right-2" : "left-2"
            )}>
              {reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  onClick={() => handleEmojiClick(reaction.emoji)}
                  className={cn(
                    "text-sm hover:scale-110 transition-transform",
                    reaction.userReacted && "scale-110"
                  )}
                >
                  {reaction.emoji}
                  {reaction.count > 1 && (
                    <span className="text-xs ml-0.5">{reaction.count}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className={cn(
            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity",
            isSent ? "right-full mr-2" : "left-full ml-2"
          )}>
            <div className="flex gap-1">
              {/* Emoji Picker */}
              <DropdownMenu open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    😊
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="grid grid-cols-3 gap-1 p-2">
                    {quickEmojis.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        className="h-10 w-10 text-lg"
                        onClick={() => handleEmojiClick(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onForward}>
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(content)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  {isSent && (
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {isSent && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender.avatar} />
          <AvatarFallback>{sender.name[0]}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default MessageBubble;
