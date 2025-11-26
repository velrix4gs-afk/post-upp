import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { ThreadedComment as ThreadedCommentType } from '@/hooks/useThreadedComments';
import { cn } from '@/lib/utils';
import { VerificationBadge } from './premium/VerificationBadge';

interface ThreadedCommentProps {
  comment: ThreadedCommentType;
  onReply: (content: string, parentId: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  isLiked: boolean;
  depth?: number;
}

export const ThreadedComment = ({
  comment,
  onReply,
  onDelete,
  onLike,
  isLiked,
  depth = 0
}: ThreadedCommentProps) => {
  const { user } = useAuth();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply(replyText, comment.id);
      setReplyText('');
      setShowReplyBox(false);
    }
  };

  const maxDepth = 3;

  return (
    <div className={cn("flex gap-2", depth > 0 && "ml-8")}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={comment.user?.avatar_url} />
        <AvatarFallback>
          {comment.user?.display_name?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-sm">
                {comment.user?.display_name || 'Unknown'}
              </p>
              <VerificationBadge 
                isVerified={comment.user?.is_verified}
                verificationType={comment.user?.verification_type}
              />
            </div>
            {user?.id === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-sm mt-1 break-words">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-3 mt-1 ml-3">
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </p>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs hover:text-pink-500",
              isLiked && "text-pink-500"
            )}
            onClick={() => onLike(comment.id)}
          >
            <Heart className={cn("h-3 w-3 mr-1", isLiked && "fill-current")} />
            {comment.likes_count > 0 && comment.likes_count}
          </Button>

          {depth < maxDepth && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs hover:text-blue-500"
              onClick={() => setShowReplyBox(!showReplyBox)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Reply
            </Button>
          )}
        </div>

        {showReplyBox && (
          <div className="mt-2 ml-3">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px] text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyBox(false);
                  setReplyText('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyText.trim()}
              >
                Reply
              </Button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <ThreadedComment
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                onLike={onLike}
                isLiked={isLiked}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
