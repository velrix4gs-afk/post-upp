import { ReactNode } from 'react';
import { Trash2 } from 'lucide-react';
import { useSwipeToDelete } from '@/hooks/useSwipeToDelete';
import { cn } from '@/lib/utils';

interface SwipeToDeleteProps {
  onDelete: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const SwipeToDelete = ({ 
  onDelete, 
  children, 
  disabled = false,
  className 
}: SwipeToDeleteProps) => {
  const { elementRef, translateX, showDelete, handlers } = useSwipeToDelete({
    onDelete,
    disabled,
  });

  return (
    <div className={cn("relative overflow-hidden", className)} ref={elementRef}>
      {/* Delete background */}
      <div 
        className="absolute inset-0 bg-destructive flex items-center justify-end px-6 lg:hidden"
        style={{
          opacity: Math.min(Math.abs(translateX) / 100, 1),
        }}
      >
        <Trash2 className="h-6 w-6 text-destructive-foreground" />
      </div>

      {/* Swipeable content */}
      <div
        className="relative w-full touch-pan-y"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: showDelete ? 'none' : 'transform 0.3s ease-out',
        }}
        {...handlers}
      >
        {children}
      </div>
    </div>
  );
};
