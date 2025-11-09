import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mail, Lock, User, Chrome, Twitter, Sparkles } from 'lucide-react';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters')
});

const SignUp = () => {
  const [authMode, setAuthMode] = useState<'email' | 'magic'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/feed`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Google sign-in is not configured yet. Please use email or phone.',
        variant: 'destructive'
      });
    }
  };

  const handleTwitterSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/feed`
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Twitter/X sign-in is not configured yet. Please use email or phone.',
        variant: 'destructive'
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = signUpSchema.parse(signUpData);
      
      const { error } = await supabase.functions.invoke('send-signup-otp', {
        body: { email: validatedData.email }
      });

      if (error) {
        toast({
          title: 'Failed to send verification code',
          description: error.message || 'Please try again later.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Verification code sent!',
        description: 'Check your email for the 6-digit code.'
      });

      navigate('/auth/verify', { 
        state: { signupData: validatedData }
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.issues[0].message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Something went wrong',
          description: 'Please try again later.',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/feed`,
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      toast({
        title: 'Magic link sent!',
        description: 'Check your email and click the link to sign in.',
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send magic link',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-border shadow-elegant relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mb-4 bg-gradient-primary rounded-2xl p-6 shadow-glow">
              <h1 className="text-4xl font-bold text-white">POST-UPP</h1>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
            <p className="text-muted-foreground mt-2">Join the community today</p>
          </div>

          {authMode === 'magic' ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setAuthMode('email')}
                className="w-full justify-start"
              >
                ← Back to sign up
              </Button>
              
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-xl font-semibold">Magic Link</h3>
                <p className="text-sm text-muted-foreground">
                  We'll send you a secure signup link
                </p>
              </div>
              
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="magic-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={magicLinkEmail}
                      onChange={(e) => setMagicLinkEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </Button>
              </form>
            </div>
          ) : (
            <>
              <form onSubmit={handleSignUp} className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      className="pl-10"
                      value={signUpData.username}
                      onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-displayname">Display Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-displayname"
                      type="text"
                      placeholder="Your display name"
                      className="pl-10"
                      value={signUpData.displayName}
                      onChange={(e) => setSignUpData({ ...signUpData, displayName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="pl-10 pr-10"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              <div className="relative mb-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 hover:bg-primary/5 transition-all"
                  onClick={handleGoogleSignIn}
                >
                  <Chrome className="h-4 w-4" />
                  Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 hover:bg-primary/5 transition-all"
                  onClick={handleTwitterSignIn}
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 hover:bg-accent/20 transition-all mb-6"
                onClick={() => setAuthMode('magic')}
              >
                <Sparkles className="h-4 w-4" />
                Sign up with Magic Link
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/signin" className="text-primary font-medium hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SignUp;
