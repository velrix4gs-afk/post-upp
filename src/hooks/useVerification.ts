import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VerificationCode {
  id: string;
  code: string;
  user_id: string | null;
  created_at: string;
  issued_at: string | null;
  used_at: string | null;
  used_by: string | null;
  purchased_at: string | null;
  status: 'available' | 'reserved' | 'issued' | 'used' | 'revoked';
  op_notes: string | null;
}

export const useVerification = () => {
  const [hasVerification, setHasVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState<VerificationCode | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', user.id)
        .single();

      setHasVerification(profile?.is_verified || false);

      // Fetch user's verification code if any
      const { data: code } = await supabase
        .from('verification_codes')
        .select('*')
        .or(`user_id.eq.${user.id},used_by.eq.${user.id}`)
        .single();

      setVerificationCode(code as VerificationCode | null);
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemCode = async (code: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to redeem a code",
          variant: "destructive"
        });
        return false;
      }

      // Find the code
      const { data: verificationCode, error: findError } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('code', code)
        .single();

      if (findError || !verificationCode) {
        toast({
          title: "Invalid Code",
          description: "The verification code you entered is invalid",
          variant: "destructive"
        });
        return false;
      }

      // Check if code is redeemable
      if (!['issued', 'available'].includes(verificationCode.status)) {
        toast({
          title: "Code Not Available",
          description: "This code has already been used or is not available",
          variant: "destructive"
        });
        return false;
      }

      // Check if assigned to this user or unassigned
      if (verificationCode.user_id && verificationCode.user_id !== user.id) {
        toast({
          title: "Code Not Available",
          description: "This code is assigned to another user",
          variant: "destructive"
        });
        return false;
      }

      // Update verification code
      const { error: updateCodeError } = await supabase
        .from('verification_codes')
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
          status: 'used'
        })
        .eq('id', verificationCode.id);

      if (updateCodeError) throw updateCodeError;

      // Update user profile
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ is_verified: true })
        .eq('id', user.id);

      if (updateProfileError) throw updateProfileError;

      toast({
        title: "Success!",
        description: "Your account has been verified"
      });

      await fetchVerificationStatus();
      return true;
    } catch (error) {
      console.error('Error redeeming code:', error);
      toast({
        title: "Error",
        description: "Failed to redeem verification code",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  return {
    hasVerification,
    verificationCode,
    loading,
    redeemCode,
    refetch: fetchVerificationStatus
  };
};
