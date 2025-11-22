import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useStoryHighlights } from '@/hooks/useStoryHighlights';
import { Skeleton } from '@/components/ui/skeleton';

interface StoryHighlightsProps {
  userId: string;
  isOwnProfile: boolean;
}

export const StoryHighlights = ({ userId, isOwnProfile }: StoryHighlightsProps) => {
  const { highlights, loading } = useStoryHighlights(userId);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[80px]">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="flex gap-4 overflow-x-auto py-4 scrollbar-hide">
      {isOwnProfile && (
        <button className="flex flex-col items-center gap-2 min-w-[80px] group">
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center group-hover:border-primary transition">
            <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">New</span>
        </button>
      )}
      
      {highlights.map(highlight => (
        <button
          key={highlight.id}
          className="flex flex-col items-center gap-2 min-w-[80px] group"
        >
          <Avatar className="h-16 w-16 ring-2 ring-primary">
            <AvatarImage src={highlight.cover_image} />
            <AvatarFallback>{highlight.title[0]}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-center line-clamp-2 group-hover:text-primary transition">
            {highlight.title}
          </span>
        </button>
      ))}
    </div>
  );
};