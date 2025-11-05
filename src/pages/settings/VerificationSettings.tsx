import { useState } from 'react';
import { useVerification } from '@/hooks/useVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

export const VerificationSettings = () => {
  const { hasVerification, verificationCode, loading, redeemCode } = useVerification();
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!code || code.length !== 12) return;
    
    setRedeeming(true);
    const success = await redeemCode(code);
    if (success) {
      setCode('');
    }
    setRedeeming(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Verification</h2>
        <p className="text-muted-foreground">
          Get verified to show authenticity on your profile
        </p>
      </div>

      {hasVerification ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <CardTitle>Verified Account</CardTitle>
            </div>
            <CardDescription>
              Your account is verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </Badge>
            </div>
            {verificationCode && (
              <div className="text-sm text-muted-foreground">
                <p>Verified on: {new Date(verificationCode.used_at || '').toLocaleDateString()}</p>
                <p>Code: ••••••••{verificationCode.code.slice(-4)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Redeem Verification Code</CardTitle>
              <CardDescription>
                Enter your 12-digit verification code to get verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 12-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  maxLength={12}
                  className="font-mono"
                />
                <Button 
                  onClick={handleRedeem}
                  disabled={code.length !== 12 || redeeming}
                >
                  {redeeming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    'Redeem'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The code is case-sensitive and must be exactly 12 digits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Get Verified</CardTitle>
              <CardDescription>
                Purchase a verification badge to get your code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Stand out with a verified badge on your profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Build trust and credibility with your audience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Get priority support from our team</span>
                </li>
              </ul>
              <Button variant="default" className="w-full" asChild>
                <a href="/premium">Purchase Verification</a>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
