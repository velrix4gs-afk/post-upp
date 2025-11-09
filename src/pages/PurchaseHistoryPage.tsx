import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePurchaseHistory } from '@/hooks/usePurchaseHistory';
import { format } from 'date-fns';
import { Receipt, Crown, Star, Zap, ShieldCheck, Check, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PurchaseHistoryPage = () => {
  const { purchases, loading, error } = usePurchaseHistory();

  const getPurchaseDetails = (type: string) => {
    const details = {
      premium_basic: {
        name: 'Basic Premium',
        icon: Star,
        color: 'from-yellow-500 to-amber-500',
        features: [
          'Remove all ads',
          'Custom profile themes',
          'Priority support',
          'Verification badge',
          '50GB storage'
        ]
      },
      premium_pro: {
        name: 'Pro Premium',
        icon: Zap,
        color: 'from-purple-500 to-pink-500',
        features: [
          'Everything in Basic',
          'Advanced analytics',
          'Schedule unlimited posts',
          'Custom URL',
          '200GB storage',
          'Exclusive content creation tools'
        ]
      },
      premium_elite: {
        name: 'Elite Premium',
        icon: Crown,
        color: 'from-blue-500 to-cyan-500',
        features: [
          'Everything in Pro',
          'Dedicated account manager',
          'API access',
          'White-label options',
          'Unlimited storage',
          'Early access to features',
          'Monetization tools'
        ]
      },
      verification_badge: {
        name: 'Verification Badge',
        icon: ShieldCheck,
        color: 'from-green-500 to-emerald-500',
        features: [
          'Official Verification Badge',
          'Increased Credibility',
          'Priority Support',
          'Stand Out in Searches'
        ]
      }
    };

    return details[type as keyof typeof details] || details.premium_basic;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        variant: 'default' as const,
        icon: Check,
        label: 'Completed',
        className: 'bg-green-500 hover:bg-green-600'
      },
      pending: {
        variant: 'secondary' as const,
        icon: Clock,
        label: 'Pending',
        className: 'bg-yellow-500 hover:bg-yellow-600'
      },
      failed: {
        variant: 'destructive' as const,
        icon: XCircle,
        label: 'Failed',
        className: 'bg-red-500 hover:bg-red-600'
      },
      refunded: {
        variant: 'outline' as const,
        icon: AlertCircle,
        label: 'Refunded',
        className: 'border-orange-500 text-orange-500'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Purchase History</h1>
              <p className="text-muted-foreground">View all your subscription and verification purchases</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load purchase history. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-24 w-full" />
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && purchases.length === 0 && (
          <Card className="p-12 text-center">
            <Receipt className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Purchases Yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't made any purchases yet. Explore our premium plans to unlock exclusive features!
            </p>
          </Card>
        )}

        {/* Purchase List */}
        {!loading && !error && purchases.length > 0 && (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const details = getPurchaseDetails(purchase.purchase_type);
              const Icon = details.icon;
              const features = purchase.features.length > 0 ? purchase.features : details.features;

              return (
                <Card key={purchase.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Icon & Basic Info */}
                    <div className="flex items-start gap-4 md:w-1/3">
                      <div className={`h-16 w-16 rounded-full bg-gradient-to-r ${details.color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-1">{details.name}</h3>
                        <p className="text-2xl font-bold text-primary mb-1">
                          ${purchase.amount.toFixed(2)}
                          <span className="text-sm text-muted-foreground font-normal ml-1">
                            {purchase.currency}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(purchase.created_at), 'PPP')}
                        </p>
                        <div className="mt-2">
                          {getStatusBadge(purchase.status)}
                        </div>
                      </div>
                    </div>

                    {/* Right: Features */}
                    <div className="md:w-2/3 md:border-l md:pl-6">
                      <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                        Features Included
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {purchase.payment_reference && (
                        <p className="text-xs text-muted-foreground mt-4">
                          Reference: {purchase.payment_reference}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default PurchaseHistoryPage;
