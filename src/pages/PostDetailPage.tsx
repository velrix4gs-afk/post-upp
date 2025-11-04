import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share, Bookmark, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PostContent } from '@/components/PostContent';
import { CommentsSection } from '@/components/CommentsSection';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useBookmarks } from '@/hooks/useBookmarks';
import { SharePostDialog } from '@/components/SharePostDialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toggleReaction } = usePosts();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [localReactionCount, setLocalReactionCount] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_author_id_fkey (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq('id', postId)
          .single();

        if (error) throw error;

        const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

        setPost({
          ...data,
          author_name: profile?.display_name,
          author_avatar: profile?.avatar_url,
        });
        setLocalReactionCount(data.reactions_count || 0);

        // Check if user liked this post
        if (user) {
          const { data: reaction } = await supabase
            .from('post_reactions')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

          setIsLiked(!!reaction);
        }
      } catch (error) {
        console.error('[POST_DETAIL_001] Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user || !postId) return;
    
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLocalReactionCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    
    try {
      await toggleReaction(postId, 'like');
    } catch (err) {
      setIsLiked(!newLikedState);
      setLocalReactionCount(post?.reactions_count || 0);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto p-4 text-center">
          <p className="text-muted-foreground">Post not found</p>
          <Button onClick={() => navigate(-1)} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-4 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">Post</h1>
          </div>
        </div>

        {/* Post content */}
        <div className="p-4 border-b">
          <div className="flex items-start gap-3 mb-4">
            <Avatar 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate(`/profile/${post.author_id}`)}
            >
              <AvatarImage src={post.author_avatar} />
              <AvatarFallback>{post.author_name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
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

          <PostContent content={post.content} />

          {post.media_url && !Array.isArray(post.media_urls) && (
            <div className="rounded-xl overflow-hidden mt-3">
              <img 
                src={post.media_url} 
                alt="Post media"
                className="w-full h-auto object-contain bg-muted"
              />
            </div>
          )}

          {post.media_urls && Array.isArray(post.media_urls) && (
            <div className={`grid gap-2 mt-3 ${
              post.media_urls.length === 1 ? 'grid-cols-1' :
              post.media_urls.length === 2 ? 'grid-cols-2' :
              post.media_urls.length === 3 ? 'grid-cols-3' :
              'grid-cols-2'
            }`}>
              {post.media_urls.map((url: string, index: number) => (
                <div key={index} className="rounded-xl overflow-hidden">
                  <img 
                    src={url} 
                    alt={`Media ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Engagement stats */}
          <div className="flex items-center gap-4 pt-4 text-sm text-muted-foreground">
            <span><strong className="text-foreground">{localReactionCount}</strong> likes</span>
            <span><strong className="text-foreground">{post.comments_count || 0}</strong> comments</span>
            <span><strong className="text-foreground">{post.shares_count || 0}</strong> shares</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t mt-4">
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
                onClick={handleLike}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Like</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="hidden sm:inline">Comment</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2" 
                onClick={() => setShowShareDialog(true)}
              >
                <Share className="h-5 w-5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => toggleBookmark(post.id)}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked(post.id) ? 'fill-current text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Comments */}
        <div className="p-4">
          <CommentsSection postId={post.id} />
        </div>
      </div>

      <SharePostDialog
        postId={post.id}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
    </div>
  );
}
