import { Heart, MoreVertical, Bookmark, Edit, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '@/hooks/usePosts';
import { usePosts } from '@/hooks/usePosts';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from './ui/textarea';
import { useState } from 'react';

interface PostCardModernProps {
  post: Post;
}

const PostCardModern = ({ post }: PostCardModernProps) => {
  const { user } = useAuth();
  const { toggleReaction, updatePost, deletePost } = usePosts();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || '');
  
  const hasLiked = post.reactions?.some(r => r.reaction_type === 'like') || false;
  const bookmarked = isBookmarked(post.id);
  const isOwnPost = user?.id === post.user_id;

  const handleEdit = async () => {
    try {
      await updatePost(post.id, { content: editedContent });
      setShowEditDialog(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost(post.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Avatar>
            <AvatarImage src={post.profiles.avatar_url} />
            <AvatarFallback>{post.profiles.display_name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{post.profiles.display_name}</span>
              {post.profiles.is_verified && <Badge variant="secondary">✓</Badge>}
              <span className="text-muted-foreground text-sm">
                @{post.profiles.username}
              </span>
              <span className="text-muted-foreground text-sm">
                · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setEditedContent(post.content || '');
                  setShowEditDialog(true);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit post
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {post.content && (
          <p className="mb-3 whitespace-pre-wrap">{post.content}</p>
        )}

        {post.media_url && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img 
              src={post.media_url} 
              alt="Post media" 
              className="w-full max-h-96 object-cover"
            />
          </div>
        )}

        <div className="flex items-center gap-1 border-t pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`gap-2 ${hasLiked ? 'text-red-500' : ''}`}
            onClick={() => toggleReaction(post.id, 'like')}
          >
            <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
            {post.reactions_count}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 ml-auto"
            onClick={() => toggleBookmark(post.id)}
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-32"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostCardModern;
