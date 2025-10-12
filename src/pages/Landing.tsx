import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we have a definitive auth state
    if (!loading && user) {
      navigate('/feed', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to PostUpp
          </h1>
          <p className="text-muted-foreground">
            Your social networking platform
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="h-3 bg-primary/20 rounded w-32"></div>
              <div className="h-2 bg-muted rounded w-24"></div>
            </div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : !user ? (
          <div className="space-y-4">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="w-full"
            >
              Get Started
            </Button>
            <p className="text-xs text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Landing;
