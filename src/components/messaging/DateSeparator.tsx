import { cn } from '@/lib/utils';

interface DateSeparatorProps {
  date: string | Date;
  className?: string;
}

const formatChatDate = (date: Date): string => {
  const now = new Date();
  const d = new Date(date);
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return d.toLocaleDateString([], { weekday: 'long' });
  }
  return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

export const DateSeparator = ({ date, className }: DateSeparatorProps) => {
  return (
    <div className={cn('flex justify-center my-3 animate-fade-up', className)}>
      <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground shadow-sm border border-border/40">
        {formatChatDate(typeof date === 'string' ? new Date(date) : date)}
      </span>
    </div>
  );
};
