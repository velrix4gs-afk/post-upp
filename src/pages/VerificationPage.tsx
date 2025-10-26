import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Shield, Star, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const VerificationPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  useEffect(() => {
    // Fetch or create the verification product
    fetchVerificationProduct();
  }, []);

  const fetchVerificationProduct = async () => {
    try {
      // In a real implementation, you would fetch the Stripe price ID
      // For now, we'll create it on demand
      const priceId = 'price_verification'; // This should be fetched from your Stripe products
      setPaymentLink(`https://buy.stripe.com/test_verification_${user?.id}`);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

  const handlePurchase = async () => {
    if (profile?.is_verified) {
      toast({
        title: 'Already Verified',
        description: 'Your account is already verified!',
      });
      return;
    }

    setLoading(true);
    try {
      // Create Stripe checkout session via edge function
      const { data, error } = await supabase.functions.invoke('create-verification-checkout', {
        body: { userId: user?.id }
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to start checkout',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary text-primary-foreground">
            <Star className="h-4 w-4 mr-1" />
            Premium Feature
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Get Verified</h1>
          <p className="text-xl text-muted-foreground">
            Stand out with an official verification badge
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Benefits Card */}
          <Card className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Benefits</h2>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Official Verification Badge</p>
                  <p className="text-sm text-muted-foreground">Blue checkmark on your profile</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Increased Credibility</p>
                  <p className="text-sm text-muted-foreground">Build trust with your audience</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Priority Support</p>
                  <p className="text-sm text-muted-foreground">Get help faster when you need it</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Stand Out</p>
                  <p className="text-sm text-muted-foreground">Appear more prominent in searches</p>
                </div>
              </li>
            </ul>
          </Card>

          {/* Pricing Card */}
          <Card className="p-8 border-2 border-primary">
            <div className="text-center mb-6">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Verification</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">one-time</span>
              </div>
            </div>

            <Button 
              className="w-full h-12 text-lg"
              onClick={handlePurchase}
              disabled={loading || profile?.is_verified}
            >
              {loading ? (
                'Processing...'
              ) : profile?.is_verified ? (
                <>
                  <Shield className="h-5 w-5 mr-2" />
                  Already Verified
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Get Verified Now
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Instant activation after payment
            </p>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What does verification mean?</h3>
              <p className="text-muted-foreground">
                Verification confirms your account's authenticity and gives you a blue checkmark badge that appears on your profile and posts.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Is this a subscription?</h3>
              <p className="text-muted-foreground">
                No, this is a one-time payment. Once verified, your badge is permanent.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Can I lose my verification?</h3>
              <p className="text-muted-foreground">
                Yes, if you violate our terms of service or community guidelines, we may remove your verification badge.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">How long does it take?</h3>
              <p className="text-muted-foreground">
                Your verification badge is activated immediately after successful payment.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default VerificationPage;
