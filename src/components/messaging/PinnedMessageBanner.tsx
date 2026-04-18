import { Pin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PinnedMessageBannerProps {
  content: string;
  senderName?: string;
  onTap: () => void;
  onUnpin?: () => void;
}

export const PinnedMessageBanner = ({ content, senderName, onTap, onUnpin }: PinnedMessageBannerProps) => {
  return (
    <div
      onClick={onTap}
      className="flex items-center gap-2 px-3 py-2 bg-card/95 backdrop-blur-md border-b border-border/50 cursor-pointer hover:bg-muted/40 transition-colors animate-fade-up"
    >
      <div className="w-1 h-8 bg-primary rounded-full flex-shrink-0" />
      <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-primary leading-tight">Pinned message</p>
        <p className="text-xs text-muted-foreground truncate leading-tight">
          {senderName ? `${senderName}: ` : ''}{content}
        </p>
      </div>
      {onUnpin && (
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 tap-scale"
          onClick={(e) => {
            e.stopPropagation();
            onUnpin();
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};
