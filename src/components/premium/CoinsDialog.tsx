import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Coins, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const coinPackages = [
  { coins: 200, price: 0.99, popular: false },
  { coins: 500, price: 2.49, popular: false },
  { coins: 1000, price: 4.99, popular: true },
  { coins: 2500, price: 9.99, popular: false },
  { coins: 5000, price: 19.99, popular: false },
];

export const CoinsDialog = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handlePurchase = async (coins: number, price: number) => {
    if (!user) {
      toast({
        title: 'AUTH_001',
        description: 'Please sign in to purchase coins',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Create checkout session for coins
      const { data, error } = await supabase.functions.invoke('create-coins-checkout', {
        body: {
          coins,
          price,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err: any) {
      console.error('[COINS_001] Error creating checkout:', err);
      toast({
        title: 'COINS_001',
        description: err.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Coins className="h-4 w-4 text-yellow-500" />
          Buy Coins
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Coins className="h-6 w-6 text-yellow-500" />
            Purchase Coins
          </DialogTitle>
          <DialogDescription>
            Buy coins to tip your favorite creators and support their content
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {coinPackages.map((pkg) => (
            <Card
              key={pkg.coins}
              className={`p-4 relative ${
                pkg.popular ? 'border-primary border-2 shadow-lg' : 'border-border'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                  Best Value
                </div>
              )}
              
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center">
                  <Coins className="h-12 w-12 text-yellow-500" />
                </div>
                
                <div>
                  <div className="text-3xl font-bold">{pkg.coins}</div>
                  <div className="text-sm text-muted-foreground">coins</div>
                </div>

                <div className="text-2xl font-bold text-primary">
                  ${pkg.price.toFixed(2)}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pkg.coins, pkg.price)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Purchase'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            What are coins?
          </h4>
          <p className="text-sm text-muted-foreground">
            Coins are the virtual currency you can use to tip creators and show appreciation for their content. 
            Each coin equals $0.01 in tip value. Support your favorite creators today!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
