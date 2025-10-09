import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import PollCard from "./PollCard";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface PostCardProps {
  post: {
    id: string;
    content: string;
    media_url?: string;
    created_at: string;
    reactions_count: number;
    comments_count: number;
    shares_count?: number;
    author_name: string;
    author_avatar?: string;
    author_id: string;
  };
}

export const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const { toggleReaction, updatePost, deletePost, posts } = usePosts();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [localReactionCount, setLocalReactionCount] = useState(post.reactions_count);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  // Check if user has liked this post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('post_reactions')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setIsLiked(true);
        }
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    };

    checkLikeStatus();
  }, [post.id, user]);

  // Update local reaction count when post prop changes
  useEffect(() => {
    setLocalReactionCount(post.reactions_count);
  }, [post.reactions_count]);

  // Fetch comments when showing them
  useEffect(() => {
    const fetchComments = async () => {
      if (!showComments) return;

      const { data } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: false });
      
      if (data) setComments(data);
    };

    fetchComments();
  }, [post.id, showComments]);

  const handleLike = async () => {
    if (!user) return;
    
    // Optimistic update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLocalReactionCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      await toggleReaction(post.id, 'like');
    } catch (err) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLocalReactionCount(post.reactions_count);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    await updatePost(post.id, { content: editContent });
    setShowEditDialog(false);
    toast({ title: "Post updated" });
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    setShowDeleteDialog(false);
    toast({ title: "Post deleted" });
  };

  const handleShare = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('post_shares')
        .insert({ post_id: post.id, user_id: user.id });
      
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
      
      toast({ title: "Post shared!" });
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message,
        variant: "destructive" 
      });
    }
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: post.id,
        user_id: user.id,
        content: commentText.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
      return;
    }

    setCommentText('');
    toast({
      title: "Comment added",
      description: "Your comment has been posted",
    });

    // Refresh comments
    const { data } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: false });
    
    if (data) setComments(data);
  };

  const isOwner = user?.id === post.author_id;

  return (
    <>
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
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden">
        <div className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <Avatar 
                className="cursor-pointer hover:opacity-80 transition-opacity h-9 w-9 md:h-10 md:w-10"
                onClick={() => navigate(`/profile/${post.author_id}`)}
              >
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback>{post.author_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <button
                  onClick={() => navigate(`/profile/${post.author_id}`)}
                  className="font-semibold hover:underline text-left text-sm md:text-base"
                >
                  {post.author_name}
                </button>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="mb-3 md:mb-4">
            <p className="text-sm md:text-base mb-3 whitespace-pre-wrap">{post.content}</p>
            {post.media_url && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={post.media_url} 
                  alt="Post media"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
            
            {/* Poll */}
            <PollCard postId={post.id} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 md:gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3 ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs md:text-sm">{localReactionCount}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3" onClick={() => setShowComments(!showComments)}>
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs md:text-sm">{post.comments_count}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3" onClick={() => handleShare()}>
                <Share className="h-4 w-4" />
                <span className="text-xs md:text-sm">{post.shares_count || 0}</span>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 md:h-9 px-2 md:px-3"
              onClick={() => setIsSaved(!isSaved)}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {showComments && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[60px] text-sm"
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  size="sm"
                >
                  Post
                </Button>
              </div>

              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.profiles?.avatar_url} />
                      <AvatarFallback>
                        {comment.profiles?.display_name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted rounded-lg p-2">
                        <p className="font-semibold text-sm">
                          {comment.profiles?.display_name}
                        </p>
                        <p className="text-sm break-words">{comment.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </>
  );
};
