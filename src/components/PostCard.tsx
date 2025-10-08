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
import { toast } from "@/hooks/use-toast";

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
  const { toggleReaction, updatePost, deletePost } = usePosts();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");

  const handleLike = async () => {
    if (!user) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    await toggleReaction(post.id, 'like');
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
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
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

          <div className="mb-4">
            <p className="text-base mb-3 whitespace-pre-wrap">{post.content}</p>
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
                <span>{post.reactions_count}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>{post.comments_count}</span>
              </Button>
              
              <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleShare()}>
                <Share className="h-4 w-4" />
                <span>{post.shares_count || 0}</span>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsSaved(!isSaved)}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
