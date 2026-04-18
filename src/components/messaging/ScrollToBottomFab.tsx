import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ScrollToBottomFabProps {
  visible: boolean;
  unreadCount?: number;
  onClick: () => void;
}

export const ScrollToBottomFab = ({ visible, unreadCount, onClick }: ScrollToBottomFabProps) => {
  if (!visible) return null;
  return (
    <div className="absolute right-3 bottom-3 z-20 animate-scale-in">
      <Button
        size="icon"
        onClick={onClick}
        className={cn(
          'h-10 w-10 rounded-full shadow-lg bg-card hover:bg-card text-foreground border border-border/50 tap-scale relative'
        )}
      >
        <ChevronDown className="h-5 w-5" />
        {unreadCount && unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-success text-success-foreground text-[10px] font-bold flex items-center justify-center animate-badge-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Button>
    </div>
  );
};
