import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    console.log('[Index] Auth state:', { user: !!user, loading });
    
    if (!loading) {
      if (user) {
        console.log('[Index] Redirecting to feed');
        navigate('/feed');
      } else {
        console.log('[Index] Redirecting to auth');
        navigate('/auth');
      }
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('[Index] Loading timeout reached');
        setShowTimeout(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading app...</p>
          
          {showTimeout && (
            <div className="space-y-3 pt-4">
              <p className="text-sm text-amber-600">
                This is taking longer than expected
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
                <Button 
                  onClick={() => navigate('/auth')}
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default Index;