import { Badge } from '@/components/ui/badge';

interface UserInterestTagsProps {
  interests?: string[] | null;
}

export const UserInterestTags = ({ interests }: UserInterestTagsProps) => {
  if (!interests || interests.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {interests.map((interest, index) => (
        <Badge 
          key={index}
          variant="secondary" 
          className="text-xs font-medium bg-muted/80 hover:bg-muted cursor-default"
        >
          {interest}
        </Badge>
      ))}
    </div>
  );
};
