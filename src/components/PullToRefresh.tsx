import { RefObject } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

export const PullToRefreshIndicator = ({ 
  isPulling, 
  isRefreshing, 
  pullDistance 
}: PullToRefreshIndicatorProps) => {
  if (!isPulling && !isRefreshing) return null;

  const opacity = Math.min(pullDistance / 80, 1);
  const rotation = (pullDistance / 80) * 360;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center pointer-events-none lg:hidden"
      style={{
        transform: `translateY(${isRefreshing ? '60px' : `${pullDistance}px`})`,
        transition: isRefreshing || !isPulling ? 'transform 0.3s ease' : 'none',
      }}
    >
      <div 
        className="bg-background border border-border rounded-full p-3 shadow-lg"
        style={{ opacity }}
      >
        <Loader2 
          className={cn(
            "h-6 w-6 text-primary",
            isRefreshing && "animate-spin"
          )}
          style={{ 
            transform: isRefreshing ? undefined : `rotate(${rotation}deg)`,
            transition: 'transform 0.1s ease'
          }}
        />
      </div>
    </div>
  );
};
