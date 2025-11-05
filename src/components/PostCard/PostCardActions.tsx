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
  return (
    <div className="flex items-center justify-between pt-2 -ml-2">
      <Button 
        variant="ghost" 
        size="sm"
        className={cn(
          "gap-2 hover:bg-blue-500/10 hover:text-blue-500 transition-colors group",
          "h-9 min-w-[44px]"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onComment();
        }}
      >
        <MessageCircle className="h-[18px] w-[18px]" />
        {commentsCount > 0 && (
          <span className="text-xs tabular-nums">{commentsCount}</span>
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        className={cn(
          "gap-2 hover:bg-green-500/10 transition-colors group",
          "h-9 min-w-[44px]",
          isReposted && "text-green-500 hover:text-green-600"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onRepost();
        }}
      >
        <Repeat2 className={cn("h-[18px] w-[18px]", isReposted && "fill-current")} />
        {repostsCount > 0 && (
          <span className="text-xs tabular-nums">{repostsCount}</span>
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm"
        className={cn(
          "gap-2 hover:bg-red-500/10 transition-colors group",
          "h-9 min-w-[44px]",
          isLiked && "text-red-500 hover:text-red-600"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
      >
        <Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-current")} />
        {likesCount > 0 && (
          <span className="text-xs tabular-nums">{likesCount}</span>
        )}
      </Button>

      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "hover:bg-blue-500/10 hover:text-blue-500 transition-colors",
            "h-9 w-9 p-0"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onShare();
          }}
        >
          <Share className="h-[18px] w-[18px]" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm"
          className={cn(
            "hover:bg-blue-500/10 transition-colors",
            "h-9 w-9 p-0",
            isBookmarked && "text-blue-500 hover:text-blue-600"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onBookmark();
          }}
        >
          <Bookmark className={cn("h-[18px] w-[18px]", isBookmarked && "fill-current")} />
        </Button>
      </div>
    </div>
  );
};
