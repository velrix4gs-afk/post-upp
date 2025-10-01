import { Heart, MessageCircle, Share2, MoreVertical, Bookmark } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '@/hooks/usePosts';
import { usePosts } from '@/hooks/usePosts';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';

interface PostCardModernProps {
  post: Post;
}

const PostCardModern = ({ post }: PostCardModernProps) => {
  const { toggleReaction } = usePosts();
  const { toggleBookmark, isBookmarked } = useBookmarks();
  
  const hasLiked = post.reactions?.some(r => r.reaction_type === 'like') || false;
  const bookmarked = isBookmarked(post.id);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.profiles.display_name}`,
        text: post.content || '',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard' });
    }
  };

  return (
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
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {post.content && (
        <p className="mb-3 whitespace-pre-wrap">{post.content}</p>
      )}

      {post.media_urls && post.media_urls.length > 0 && (
        <div className="mb-3 rounded-lg overflow-hidden">
          <img 
            src={post.media_urls[0]} 
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
          {post.likes_count}
        </Button>

        <Button variant="ghost" size="sm" className="gap-2">
          <MessageCircle className="h-4 w-4" />
          {post.comments_count}
        </Button>

        <Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Share
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
  );
};

export default PostCardModern;
