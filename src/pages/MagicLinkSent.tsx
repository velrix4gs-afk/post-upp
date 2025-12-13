import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft, RefreshCw, CheckCircle, Clock } from 'lucide-react';

const MagicLinkSent = () => {
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/signin');
      return;
    }

    // Countdown timer for resend button
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleResend = async () => {
    if (!canResend || resending) return;

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

      // Reset timer
      setResendTimer(60);
      setCanResend(false);

      toast({
        title: 'Magic link sent!',
        description: 'A new sign-in link has been sent to your email.'
      });

      // Start countdown again
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend magic link',
        variant: 'destructive'
      });
    } finally {
      setResending(false);
    }
  };

  const openEmailApp = () => {
    // Try to open email app
    const emailDomain = email?.split('@')[1]?.toLowerCase();
    
    const emailProviders: Record<string, string> = {
      'gmail.com': 'https://mail.google.com',
      'googlemail.com': 'https://mail.google.com',
      'yahoo.com': 'https://mail.yahoo.com',
      'outlook.com': 'https://outlook.live.com',
      'hotmail.com': 'https://outlook.live.com',
      'icloud.com': 'https://www.icloud.com/mail',
      'protonmail.com': 'https://mail.proton.me',
      'proton.me': 'https://mail.proton.me'
    };

    const providerUrl = emailProviders[emailDomain || ''];
    if (providerUrl) {
      window.open(providerUrl, '_blank');
    } else {
      window.location.href = 'mailto:';
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md bg-card backdrop-blur-sm border-border/50 shadow-lg relative z-10">
        <div className="p-8 space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/signin')}
            className="hover:bg-muted/50 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to sign in
          </Button>

          {/* Success Icon */}
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Check your email</h1>
              <p className="text-muted-foreground">
                We sent a magic link to
              </p>
              <p className="font-medium text-foreground">{email}</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Open your email inbox
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Look for an email from POST UP
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the magic link to sign in instantly
              </p>
            </div>
          </div>

          {/* Open email app button */}
          <Button
            onClick={openEmailApp}
            className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-all"
          >
            <Mail className="h-4 w-4 mr-2" />
            Open Email App
          </Button>

          {/* Resend section */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              Link expires in 15 minutes
            </p>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">Didn't receive it?</span>
              {canResend ? (
                <Button
                  variant="link"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-primary p-0 h-auto"
                >
                  {resending ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend link'
                  )}
                </Button>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Resend in {resendTimer}s
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Check your spam folder if you don't see it
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MagicLinkSent;
