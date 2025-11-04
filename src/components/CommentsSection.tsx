import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Trash2, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useComments } from '@/hooks/useComments';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface CommentsSectionProps {
  postId: string;
}

export const CommentsSection = ({ postId }: CommentsSectionProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { comments, loading, addComment, deleteComment } = useComments(postId);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addComment(commentText);
      setCommentText('');
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Comments</h2>
      
      {/* Add comment form */}
      <div className="flex gap-3 pb-4 border-b">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px] resize-none rounded-2xl bg-muted border-0"
          />
          <div className="flex items-center justify-end mt-3">
            <Button
              onClick={handleSubmit}
              disabled={!commentText.trim() || isSubmitting}
              className="rounded-full"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar 
                className="h-10 w-10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${comment.user_id}`)}
              >
                <AvatarImage src={comment.user?.avatar_url} />
                <AvatarFallback>
                  {comment.user?.display_name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-2xl p-3">
                  <button
                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                    className="font-semibold text-sm hover:underline"
                  >
                    {comment.user?.display_name || 'Unknown'}
                  </button>
                  <p className="text-sm mt-1 break-words">{comment.content}</p>
                  
                  {(comment as any).media_url && (
                    <div className="mt-3 rounded-lg overflow-hidden">
                      <img 
                        src={(comment as any).media_url} 
                        alt="Comment attachment"
                        className="w-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open((comment as any).media_url, '_blank')}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-2 ml-3">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    <Heart className="h-3 w-3 mr-1" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-semibold text-muted-foreground hover:text-foreground">
                    Reply
                  </Button>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-destructive hover:text-destructive/80"
                      onClick={() => deleteComment(comment.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">No comments yet</p>
              <p className="text-muted-foreground text-xs mt-1">Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
