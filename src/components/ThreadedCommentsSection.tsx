import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useThreadedComments } from '@/hooks/useThreadedComments';
import { ThreadedComment } from './ThreadedComment';

interface ThreadedCommentsSectionProps {
  postId: string;
}

export const ThreadedCommentsSection = ({ postId }: ThreadedCommentsSectionProps) => {
  const { user } = useAuth();
  const { 
    comments, 
    loading, 
    addComment, 
    deleteComment, 
    toggleLike, 
    isCommentLiked 
  } = useThreadedComments(postId);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(commentText);
      setCommentText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (content: string, parentId: string) => {
    await addComment(content, parentId);
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex gap-2">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[60px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Comment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <ThreadedComment
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={deleteComment}
              onLike={toggleLike}
              isLiked={isCommentLiked(comment.id)}
            />
          ))}
          {comments.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  );
};
