import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Mail, RefreshCw } from 'lucide-react';

type AuthStatus = 'verifying' | 'success' | 'confirmation' | 'error' | 'expired';

const AuthCallback = () => {
  const [status, setStatus] = useState<AuthStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from URL (Supabase magic link format)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        // Check for error in hash
        if (error) {
          if (errorDescription?.includes('expired')) {
            setStatus('expired');
            setErrorMessage('This magic link has expired. Please request a new one.');
          } else {
            setStatus('error');
            setErrorMessage(errorDescription || 'Authentication failed');
          }
          return;
        }

        // If we have tokens in the hash, set the session
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setErrorMessage(sessionError.message);
            return;
          }

          if (data.session) {
            // Check if this is a password recovery flow
            const type = hashParams.get('type');
            if (type === 'recovery') {
              // Password recovery - redirect directly to reset password
              toast({
                title: 'Reset your password',
                description: 'Please create a new password for your account.'
              });
              navigate('/reset-password', { replace: true });
              return;
            }

            // Regular magic link - show confirmation dialog
            setStatus('confirmation');
            return;
          }
        }

        // Check if we already have a session (redirect from email)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Check for recovery event type
          const type = hashParams.get('type');
          if (type === 'recovery') {
            navigate('/reset-password', { replace: true });
            return;
          }
          
          setStatus('confirmation');
          return;
        }

        // No valid auth found
        setStatus('error');
        setErrorMessage('Invalid or expired authentication link. Please request a new one.');

      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Something went wrong');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const handleResendMagicLink = async () => {
    if (!email) {
      navigate('/signin');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false
        }
      });

      if (error) throw error;

      toast({
        title: 'Magic link sent!',
        description: 'Check your email for a new sign-in link.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send magic link',
        variant: 'destructive'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <Card className="w-full max-w-md bg-card backdrop-blur-sm border-border/50 shadow-lg relative z-10">
        <div className="p-8 text-center space-y-6">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-glow mb-2">
            <span className="text-2xl font-bold text-white">PU</span>
          </div>

          {status === 'verifying' && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Verifying your magic link...</h2>
                <p className="text-muted-foreground mt-2">Please wait while we sign you in</p>
              </div>
            </div>
          )}

          {status === 'confirmation' && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-600">Successfully Signed In!</h2>
                <p className="text-muted-foreground mt-2">
                  Welcome back! What would you like to do?
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => navigate('/feed', { replace: true })}
                  className="w-full"
                >
                  Continue to POST UP
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/reset-password', { replace: true })}
                  className="w-full"
                >
                  Change Password
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-green-600">Successfully signed in!</h2>
                <p className="text-muted-foreground mt-2">Redirecting you to your feed...</p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
            </div>
          )}

          {status === 'expired' && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10">
                <Mail className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-amber-600">Link Expired</h2>
                <p className="text-muted-foreground mt-2">
                  This magic link has expired. Magic links are valid for 15 minutes.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    onClick={handleResendMagicLink}
                    disabled={resending || !email}
                    className="w-full gap-2"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Send New Magic Link
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/signin')}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-destructive">Authentication Failed</h2>
                <p className="text-muted-foreground mt-2">{errorMessage}</p>
              </div>
              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => navigate('/signin')}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
