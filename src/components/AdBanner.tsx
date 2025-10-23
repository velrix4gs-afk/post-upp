import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface AdBannerProps {
  position?: 'feed' | 'sidebar';
  className?: string;
}

export const AdBanner = ({ position = 'feed', className = '' }: AdBannerProps) => {
  // Placeholder for future ad integration (Google AdSense, etc.)
  
  return (
    <Card className={`p-4 bg-gradient-card border-dashed border-2 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs">
          Sponsored
        </Badge>
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </div>
      
      <div className={`${position === 'feed' ? 'min-h-[200px]' : 'min-h-[250px]'} flex items-center justify-center bg-muted/20 rounded-lg`}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm font-medium">Ad Space</p>
          <p className="text-xs mt-1">Support us by viewing ads</p>
        </div>
      </div>
    </Card>
  );
};
