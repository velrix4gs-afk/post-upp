import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Repeat2, Share, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostCardActionsProps {
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  sharesCount: number;
  onLike: () => void;
  onRepost: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
}

export const PostCardActions = ({
  isLiked,
  isReposted,
  isBookmarked,
  likesCount,
  commentsCount,
  repostsCount,
  sharesCount,
  onLike,
  onRepost,
  onComment,
  onShare,
  onBookmark,
}: PostCardActionsProps) => {
  const [heartPop, setHeartPop] = useState(false);
  const [bookmarkSlide, setBookmarkSlide] = useState(false);
  const [repostPop, setRepostPop] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartPop(true);
    setTimeout(() => setHeartPop(false), 350);
    onLike();
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkSlide(true);
    setTimeout(() => setBookmarkSlide(false), 300);
    onBookmark();
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRepostPop(true);
    setTimeout(() => setRepostPop(false), 350);
    onRepost();
  };

  return (
    <div className="flex items-center justify-between pt-2 -ml-2">
      <Button 
        variant="ghost" 
        size="sm"
        className={cn(
          "gap-2 hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-200 group tap-scale",
          "h-9 min-w-[44px]"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onComment();
        }}
      >
        <MessageCircle className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
        {commentsCount > 0 && (
          <span className="text-xs tabular-nums">{commentsCount}</span>
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        className={cn(
          "gap-2 hover:bg-green-500/10 transition-all duration-200 group tap-scale",
          "h-9 min-w-[44px]",
          isReposted && "text-green-500 hover:text-green-600"
        )}
        onClick={handleRepost}
      >
        <Repeat2 className={cn(
          "h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110",
          isReposted && "fill-current",
          repostPop && "animate-heart-pop"
        )} />
        {repostsCount > 0 && (
          <span className="text-xs tabular-nums">{repostsCount}</span>
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        className={cn(
          "gap-2 hover:bg-red-500/10 transition-all duration-200 group tap-scale",
          "h-9 min-w-[44px]",
          isLiked && "text-red-500 hover:text-red-600"
        )}
        onClick={handleLike}
      >
        <Heart className={cn(
          "h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110",
          isLiked && "fill-current",
          heartPop && "animate-heart-pop"
        )} />
        {likesCount > 0 && (
          <span className="text-xs tabular-nums">{likesCount}</span>
        )}
      </Button>

      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-200 tap-scale",
            "h-9 w-9 p-0"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
        >
          <Share className="h-[18px] w-[18px] transition-transform duration-200 hover:scale-110" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "hover:bg-blue-500/10 transition-all duration-200 tap-scale",
            "h-9 w-9 p-0",
            isBookmarked && "text-blue-500 hover:text-blue-600"
          )}
          onClick={handleBookmark}
        >
          <Bookmark className={cn(
            "h-[18px] w-[18px] transition-transform duration-200",
            isBookmarked && "fill-current",
            bookmarkSlide && "animate-bookmark-slide"
          )} />
        </Button>
      </div>
    </div>
  );
};
