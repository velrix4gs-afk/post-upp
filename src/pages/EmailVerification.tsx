import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const EmailVerification = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const signupData = location.state?.signupData;
  const email = signupData?.email;

  useEffect(() => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'No email found. Please sign up again.',
        variant: 'destructive'
      });
      navigate('/auth');
    }
  }, [email, navigate]);

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
      // Verify OTP with database
      const { data: otpRecord, error: otpError } = await supabase
        .from('email_otps')
        .select('*')
        .eq('email', email)
        .eq('code', otp)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        toast({
          title: 'Invalid code',
          description: 'The code you entered is incorrect or has expired.',
          variant: 'destructive'
        });
        return;
      }

      // Create the user account
      const { error: signUpError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            username: signupData.username,
            display_name: signupData.displayName
          },
          emailRedirectTo: `${window.location.origin}/feed`
        }
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({
            title: 'Account exists',
            description: 'This email is already registered. Please sign in instead.',
            variant: 'destructive'
          });
          navigate('/auth');
        } else {
          throw signUpError;
        }
        return;
      }

      // Delete used OTP
      await supabase
        .from('email_otps')
        .delete()
        .eq('id', otpRecord.id);

      toast({
        title: 'Account created!',
        description: 'Welcome to POST UP!'
      });

      navigate('/feed');

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Verification failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-signup-otp', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: 'Code resent',
        description: 'A new verification code has been sent to your email.'
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card border-0 shadow-xl">
        <div className="p-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign Up
          </Button>

          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
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
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
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
    </div>
  );
};

export default EmailVerification;
