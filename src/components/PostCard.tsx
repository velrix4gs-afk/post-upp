import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Pencil, Trash2, DollarSign, UserPlus, UserMinus, BellOff, AlertCircle, Ban, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useFollowers } from "@/hooks/useFollowers";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { PollCard } from "./PollCard";
import { PostContent } from "./PostContent";
import { CommentsSection } from "./CommentsSection";
import { SharePostDialog } from "./SharePostDialog";
import { TipDialog } from "./premium/TipDialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator, 
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
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const { followUser, unfollowUser, following } = useFollowers();
  const { blockUser } = useBlockedUsers();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [localReactionCount, setLocalReactionCount] = useState(post.reactions_count);
  const [showComments, setShowComments] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const isOwner = user?.id === post.author_id;
  const isFollowingAuthor = following.some(f => f.following?.id === post.author_id);

  const handleFollowToggle = async () => {
    if (isFollowingAuthor) {
      await unfollowUser(post.author_id);
      toast({
        title: 'Success',
        description: 'Unfollowed user',
      });
    } else {
      await followUser(post.author_id, false);
      toast({
        title: 'Success',
        description: 'Following user',
      });
    }
  };

  const handleMuteUser = () => {
    toast({
      title: 'Mute User',
      description: 'Mute feature coming soon',
    });
  };

  const handleReportPost = () => {
    toast({
      title: 'Report Post',
      description: 'Report feature coming soon',
    });
  };

  const handleBlockUser = async () => {
    await blockUser(post.author_id, 'Blocked from post');
    toast({
      title: 'User Blocked',
      description: 'This user has been blocked',
    });
  };

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
        console.error('[REACT_001] Error checking like status:', err);
      }
    };

    checkLikeStatus();
  }, [post.id, user]);

  // Update local reaction count when post prop changes
  useEffect(() => {
    setLocalReactionCount(post.reactions_count);
  }, [post.reactions_count]);

  const handleLike = async () => {
    if (!user) return;
    
    // Optimistic update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLocalReactionCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      await toggleReaction(post.id, 'like');
      // Force refetch to ensure count is in sync
      const { data } = await supabase
        .from('posts')
        .select('reactions_count')
        .eq('id', post.id)
        .single();
      if (data) {
        setLocalReactionCount(data.reactions_count);
      }
    } catch (err) {
      // Revert on error
      setIsLiked(!newLikedState);
      setLocalReactionCount(post.reactions_count);
      toast({
        title: 'Something went wrong',
        description: 'Failed to update like • REACT_002',
        variant: 'destructive'
      });
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

  const handleShare = () => {
    setShowShareDialog(true);
  };

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
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar 
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${post.author_id}`)}
              >
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback>{post.author_name?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <button
                  onClick={() => navigate(`/profile/${post.author_id}`)}
                  className="font-semibold hover:underline text-left"
                >
                  {post.author_name}
                </button>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                {isOwner ? (
                  <>
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => navigate(`/profile/${post.author_id}`)}>
                      <UserCircle className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleFollowToggle}>
                      {isFollowingAuthor ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfollow @{post.author_name}
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow @{post.author_name}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMuteUser}>
                      <BellOff className="h-4 w-4 mr-2" />
                      Mute User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleReportPost} className="text-destructive">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Report Post
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                      <Ban className="h-4 w-4 mr-2" />
                      Block User
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div 
            className="mb-4 cursor-pointer" 
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <PostContent content={post.content} />
            {post.media_url && !Array.isArray((post as any).media_urls) && (
              <div className="rounded-lg overflow-hidden mt-3">
                <img 
                  src={post.media_url} 
                  alt="Post media"
                  className="w-full h-auto max-h-[600px] object-contain bg-muted hover:opacity-95 transition-opacity"
                />
              </div>
            )}
            {(post as any).media_urls && Array.isArray((post as any).media_urls) && (
              <div className={`grid gap-2 mt-3 ${
                (post as any).media_urls.length === 1 ? 'grid-cols-1' :
                (post as any).media_urls.length === 2 ? 'grid-cols-2' :
                (post as any).media_urls.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {(post as any).media_urls.map((url: string, index: number) => (
                  <div key={index} className="rounded-lg overflow-hidden cursor-pointer" onClick={() => window.open(url, '_blank')}>
                    <img 
                      src={url} 
                      alt={`Media ${index + 1}`}
                      className="w-full h-48 object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Poll */}
            <PollCard postId={post.id} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{localReactionCount}</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
                <Share className="h-4 w-4" />
                <span>{post.shares_count || 0}</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => toggleBookmark(post.id)}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked(post.id) ? 'fill-current text-primary' : ''}`} />
              </Button>

              {user?.id !== post.author_id && (
                <TipDialog 
                  recipientId={post.author_id}
                  recipientName={post.author_name}
                />
              )}
            </div>
          </div>

          {showComments && <CommentsSection postId={post.id} />}
        </div>
      </Card>

      <SharePostDialog
        postId={post.id}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </>
  );
};
