import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadReceiptIndicatorProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOwn: boolean;
}

export const ReadReceiptIndicator = ({ status, isOwn }: ReadReceiptIndicatorProps) => {
  if (!isOwn || status === 'failed') return null;

  if (status === 'sending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
      </span>
    );
  }

  if (status === 'sent') {
    return (
      <Check className="h-3 w-3 text-muted-foreground" />
    );
  }

  if (status === 'delivered') {
    return (
      <CheckCheck className="h-3 w-3 text-muted-foreground" />
    );
  }

  if (status === 'read') {
    return (
      <CheckCheck className="h-3 w-3 text-primary" />
    );
  }

  return null;
};
