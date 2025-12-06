import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BadgeCheck, Sparkles } from 'lucide-react';

interface VerificationBannerProps {
  isViewerVerified?: boolean;
}

export const VerificationBanner = ({ isViewerVerified }: VerificationBannerProps) => {
  const navigate = useNavigate();

  if (isViewerVerified) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
            <BadgeCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              You aren't verified yet
            </h3>
            <p className="text-xs text-muted-foreground">
              Get verified to stand out and build trust with your audience
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => navigate('/premium')}
          className="rounded-full font-semibold whitespace-nowrap"
        >
          Get Verified
        </Button>
      </div>
    </div>
  );
};
