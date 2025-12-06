import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreHorizontal, Share2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  postsCount: number;
  isOwnProfile?: boolean;
}

export const ProfileHeader = ({ 
  displayName, 
  username, 
  postsCount,
  isOwnProfile 
}: ProfileHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/feed');
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName}'s Profile`,
          text: `Check out ${displayName}'s profile on Post Up!`,
          url: profileUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: 'Link copied!',
        description: 'Profile link copied to clipboard',
      });
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="container mx-auto px-3 py-2 flex items-center gap-3 max-w-4xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="h-9 w-9 rounded-full hover:bg-muted"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate leading-tight">{displayName}</h1>
          <p className="text-xs text-muted-foreground">
            {postsCount.toLocaleString()} {postsCount === 1 ? 'post' : 'posts'}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-9 w-9 rounded-full hover:bg-muted"
            aria-label="Share profile"
          >
            <Share2 className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-muted"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleShare}>
                Share profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`@${username}`)}>
                Copy username
              </DropdownMenuItem>
              {!isOwnProfile && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Block @{username}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Report @{username}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
