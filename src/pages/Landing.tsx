import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Landing = () => {
  console.log('[Landing] Component loaded');
  
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  
  // Try to get auth, but don't let it block the page
  let user = null;
  let loading = true;
  
  try {
    const auth = useAuth();
    user = auth.user;
    loading = auth.loading;
  } catch (error) {
    console.error('[Landing] Auth hook error:', error);
    loading = false;
  }

  useEffect(() => {
    console.log('[Landing] Mounted, auth state:', { user: !!user, loading });
    setMounted(true);
    
    // Auto-redirect after a short delay if user is logged in
    if (!loading && user) {
      const timer = setTimeout(() => {
        console.log('[Landing] Redirecting to feed');
        navigate('/feed', { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  // Always show something, even if auth is broken
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

        {!mounted || loading ? (
          <div className="space-y-4">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="h-3 bg-primary/20 rounded w-32"></div>
              <div className="h-2 bg-muted rounded w-24"></div>
            </div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={() => {
                console.log('[Landing] Navigating to auth');
                navigate('/auth');
              }}
              size="lg"
              className="w-full"
            >
              Get Started
            </Button>
            <p className="text-xs text-muted-foreground">
              Sign in or create an account to continue
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
