import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  tier?: 'basic' | 'pro' | 'elite';
  className?: string;
}

export const PremiumBadge = ({ tier = 'basic', className }: PremiumBadgeProps) => {
  const configs = {
    basic: {
      icon: Star,
      label: 'Premium',
      className: 'bg-gradient-to-r from-yellow-500 to-amber-500'
    },
    pro: {
      icon: Zap,
      label: 'Pro',
      className: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    elite: {
      icon: Crown,
      label: 'Elite',
      className: 'bg-gradient-to-r from-blue-500 to-cyan-500'
    }
  };

  const config = configs[tier];
  const Icon = config.icon;

  return (
    <Badge 
      className={cn(
        'text-white border-0 gap-1',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};
