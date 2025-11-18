import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export const VerificationBadge = ({ className, showLabel = false }: VerificationBadgeProps) => {
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-0.5',
        className
      )}
      title="Verified Account"
    >
      <CheckCircle2 className="h-4 w-4 fill-[#1d9bf0] text-white" />
      {showLabel && <span className="text-xs font-medium text-muted-foreground">Verified</span>}
    </div>
  );
};
