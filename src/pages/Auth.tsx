import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Mail, Lock, User, Phone, Chrome, Twitter } from 'lucide-react';
import { z } from 'zod';
import PhoneAuth from '@/components/PhoneAuth';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  displayName: z.string().min(2, 'Display name must be at least 2 characters')
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const Auth = () => {
  const [authMode, setAuthMode] = useState<'email' | 'phone' | 'magic'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    username: '',
    displayName: ''
  });
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  // Navigation is handled by Index.tsx and ProtectedRoute - no redirect needed here

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
      
      // Send OTP to email
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

      // Navigate to verification page with signup data
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
        }
      });

      if (error) throw error;

      toast({
        title: 'Magic link sent!',
        description: 'Check your email for the login link.',
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
      <main>
      <Card className="w-full max-w-md md:max-w-lg bg-gradient-card border-0 shadow-xl">
        <div className="p-6 md:p-8">
          <div className="text-center mb-8">
            <div className="mb-3 bg-gradient-primary rounded-xl p-6">
              <h1 className="text-4xl font-bold text-white">
                POST-UPP
              </h1>
            </div>
          </div>

          {authMode === 'phone' ? (
            <div>
              <PhoneAuth 
                onBack={() => setAuthMode('email')}
                onSuccess={() => navigate('/feed')}
              />
            </div>
          ) : authMode === 'magic' ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setAuthMode('email')}
                className="w-full justify-start"
              >
                ← Back to login options
              </Button>
              
              <div className="text-center space-y-2 mb-6">
                <h3 className="text-xl font-semibold">Magic Link Sign In</h3>
                <p className="text-sm text-muted-foreground">
                  We'll send you a secure login link via email
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
              <div className="space-y-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={handleGoogleSignIn}
                >
                  <Chrome className="h-5 w-5" />
                  Continue with Google
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={handleTwitterSignIn}
                >
                  <Twitter className="h-5 w-5" />
                  Continue with Twitter/X
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={() => setAuthMode('phone')}
                >
                  <Phone className="h-5 w-5" />
                  Continue with Phone
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 hover:bg-primary/5 transition-colors"
                  onClick={() => setAuthMode('magic')}
                >
                  <Mail className="h-5 w-5" />
                  Send Magic Link
                </Button>
              </div>

              <div className="relative mb-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR CONTINUE WITH EMAIL
                </span>
              </div>

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                  <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
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

                    <Button type="submit" className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
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
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </Card>
      </main>
    </div>
  );
};

export default Auth;
