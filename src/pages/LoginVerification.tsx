import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const LoginVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'No email found. Please try signing in again.',
        variant: 'destructive'
      });
      navigate('/signin');
    }
  }, [email, navigate]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Verify OTP via edge function
      const { data, error } = await supabase.functions.invoke('verify-login-otp', {
        body: { email, code: otp }
      });

      if (error || data?.error) {
        const errorMessage = data?.error || error?.message || 'Verification failed';
        toast({
          title: 'Verification failed',
          description: errorMessage,
          variant: 'destructive'
        });
        setOtp(''); // Clear OTP on error
        return;
      }

      // Use the token to verify OTP with Supabase
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'magiclink'
      });

      if (verifyError) {
        console.error('Supabase verify error:', verifyError);
        toast({
          title: 'Sign in failed',
          description: 'Failed to complete sign in. Please try again.',
          variant: 'destructive'
        });
        setOtp('');
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.'
      });

      navigate('/feed', { replace: true });

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-login-otp', {
        body: { email }
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Failed to resend code');
      }

      setOtp(''); // Clear the OTP input
      toast({
        title: 'Code resent',
        description: 'A new sign-in code has been sent to your email.'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-md bg-card backdrop-blur-sm border-border/50 shadow-lg relative z-10">
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/signin')}
            className="mb-6 hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>

          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Enter Your Code</h1>
            <p className="text-muted-foreground">
              We sent a 6-digit code to<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                disabled={loading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:shadow-glow transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                variant="link"
                onClick={handleResend}
                disabled={resending}
                className="text-primary"
              >
                {resending ? 'Sending...' : 'Resend Code'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
};

export default LoginVerification;
