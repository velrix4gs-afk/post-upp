import { Shield, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EncryptionBadgeProps {
  enabled?: boolean;
  className?: string;
}

export const EncryptionBadge = ({ enabled = true, className }: EncryptionBadgeProps) => {
  if (!enabled) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`gap-1 ${className}`}>
            <ShieldCheck className="h-3 w-3 text-success" />
            <span className="text-xs">Encrypted</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">End-to-end encrypted</p>
          <p className="text-xs text-muted-foreground">Only you and the recipient can read this</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
