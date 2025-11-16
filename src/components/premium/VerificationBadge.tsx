import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export const VerificationBadge = ({ className, showLabel = false }: VerificationBadgeProps) => {
  return (
    <Badge 
      className={cn(
        'bg-blue-500 hover:bg-blue-600 text-white border-0 gap-0.5 px-1.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      <CheckCircle2 className="h-3 w-3 fill-current" />
      {showLabel && <span>Verified</span>}
    </Badge>
  );
};
