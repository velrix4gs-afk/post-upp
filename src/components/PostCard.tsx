import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  MoreHorizontal,
  Laugh,
  ThumbsUp
} from "lucide-react";
import { useState } from "react";

interface PostCardProps {
  author: {
    name: string;
    username: string;
    avatar?: string;
    verified?: boolean;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

const PostCard = ({ 
  author, 
  content, 
  image, 
  timestamp, 
  likes, 
  comments, 
  shares 
}: PostCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  return (
    <Card className="bg-gradient-card border-0 hover:shadow-md transition-all duration-300">
      <div className="p-4">
        {/* Post Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={author.avatar} />
              <AvatarFallback className="bg-gradient-primary text-white text-sm">
                {author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm">{author.name}</h3>
                {author.verified && (
                  <Badge variant="secondary" className="h-4 px-1 text-xs">✓</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                @{author.username} • {timestamp}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed mb-3">{content}</p>
          {image && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={image} 
                alt="Post content" 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* Post Stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
          <div className="flex items-center space-x-4">
            <span>{likes.toLocaleString()} likes</span>
            <span>{comments} comments</span>
          </div>
          <span>{shares} shares</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center space-x-1">
            {/* Like Button with Reactions */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 px-3 ${isLiked ? 'text-destructive hover:text-destructive' : ''}`}
                onClick={() => setIsLiked(!isLiked)}
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
              >
                <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">Like</span>
              </Button>
              
              {/* Reaction Popup */}
              {showReactions && (
                <div className="absolute bottom-full left-0 mb-2 bg-card border rounded-full p-2 shadow-lg flex space-x-1 z-10">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10">
                    <Heart className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10">
                    <ThumbsUp className="h-4 w-4 text-primary" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-warning/10">
                    <Laugh className="h-4 w-4 text-warning" />
                  </Button>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" className="h-9 px-3">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="text-xs">Comment</span>
            </Button>

            <Button variant="ghost" size="sm" className="h-9 px-3">
              <Share2 className="h-4 w-4 mr-2" />
              <span className="text-xs">Share</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={`h-9 w-9 p-0 ${isSaved ? 'text-warning' : ''}`}
            onClick={() => setIsSaved(!isSaved)}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PostCard;