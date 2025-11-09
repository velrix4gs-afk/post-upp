import { usePresenceSystem } from '@/hooks/usePresenceSystem';

interface OnlineIndicatorProps {
  userId: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OnlineIndicator = ({ userId, showLabel = false, size = 'sm' }: OnlineIndicatorProps) => {
  const { isUserOnline } = usePresenceSystem();
  const isOnline = isUserOnline(userId);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  if (!isOnline && !showLabel) return null;

  return (
    <div className="flex items-center gap-1">
      <div 
        className={`${sizeClasses[size]} rounded-full ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        } ring-2 ring-background`}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

export default OnlineIndicator;
