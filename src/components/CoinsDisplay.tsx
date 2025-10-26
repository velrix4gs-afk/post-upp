import { Coins } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const CoinsDisplay = () => {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();

  if (!profile) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigate('/premium')}
      className="flex items-center gap-2"
    >
      <Coins className="h-4 w-4 text-yellow-500" />
      <span className="font-semibold">{(profile as any).coins_balance || 0}</span>
    </Button>
  );
};