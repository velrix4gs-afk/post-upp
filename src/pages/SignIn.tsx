import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mail, Lock, Chrome, Twitter, Phone } from 'lucide-react';
import { z } from 'zod';
import PhoneAuth from '@/components/PhoneAuth';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const SignIn = () => {
  const [authMode, setAuthMode] = useState<'email' | 'phone' | 'magic'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = signInSchema.parse(signInData);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password
      });

      if (error) {
        toast({
          title: 'Sign in failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in.'
      });
      
      navigate('/feed');
      
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
          shouldCreateUser: false,
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent/5 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-card border-0 shadow-elegant">
        <div className="p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="mb-4 bg-gradient-primary rounded-xl p-6">
              <h1 className="text-4xl font-bold text-white">POST-UPP</h1>
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Sign In</h2>
            <p className="text-muted-foreground mt-2">Welcome back! Sign in to your account</p>
          </div>

          {authMode === 'phone' ? (
            <PhoneAuth 
              onBack={() => setAuthMode('email')}
              onSuccess={() => navigate('/feed')}
            />
          ) : authMode === 'magic' ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setAuthMode('email')}
                className="w-full justify-start"
              >
                ← Back to sign in
              </Button>
              
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-xl font-semibold">Magic Link</h3>
                <p className="text-sm text-muted-foreground">
                  We'll send you a secure login link
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
              <form onSubmit={handleSignIn} className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
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

                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>

                <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              <div className="relative mb-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={handleGoogleSignIn}
                >
                  <Chrome className="h-4 w-4" />
                  Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={handleTwitterSignIn}
                >
                  <Twitter className="h-4 w-4" />
                  Twitter/X
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={() => setAuthMode('phone')}
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={() => setAuthMode('magic')}
                >
                  <Mail className="h-4 w-4" />
                  Magic Link
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    Sign Up
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

export default SignIn;
