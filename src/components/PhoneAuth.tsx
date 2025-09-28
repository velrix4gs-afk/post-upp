import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { usePhoneAuth } from '@/hooks/usePhoneAuth';
import { Phone, ArrowLeft } from 'lucide-react';

interface PhoneAuthProps {
  onBack: () => void;
  onSuccess: () => void;
}

const PhoneAuth = ({ onBack, onSuccess }: PhoneAuthProps) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const { isLoading, isCodeSent, error, sendOTP, verifyOTP, resetState } = usePhoneAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    
    // Format phone number (basic validation)
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    await sendOTP(formattedPhone);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    
    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      await verifyOTP(formattedPhone, otp);
      onSuccess();
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleBack = () => {
    resetState();
    onBack();
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-card border-0 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-primary p-3 rounded-full">
            <Phone className="h-6 w-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">
          {isCodeSent ? 'Enter Verification Code' : 'Sign in with Phone'}
        </CardTitle>
        <CardDescription>
          {isCodeSent 
            ? `We've sent a verification code to ${phone}`
            : 'Enter your phone number to receive a verification code'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCodeSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                resetState();
                setOtp('');
              }}
              disabled={isLoading}
            >
              Resend Code
            </Button>
          </form>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={handleBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login Options
        </Button>
      </CardContent>
    </Card>
  );
};

export default PhoneAuth;