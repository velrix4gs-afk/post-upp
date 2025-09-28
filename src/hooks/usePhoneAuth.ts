import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

export interface PhoneAuthState {
  isLoading: boolean;
  isCodeSent: boolean;
  error: string | null;
}

export const usePhoneAuth = () => {
  const [state, setState] = useState<PhoneAuthState>({
    isLoading: false,
    isCodeSent: false,
    error: null,
  });

  const sendOTP = async (phone: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;

      setState(prev => ({ ...prev, isCodeSent: true, isLoading: false }));
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code.',
      });
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const verifyOTP = async (phone: string, token: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (error) throw error;

      setState(prev => ({ ...prev, isLoading: false }));
      toast({
        title: 'Success',
        description: 'Phone number verified successfully!',
      });
      
      return data;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const resetState = () => {
    setState({
      isLoading: false,
      isCodeSent: false,
      error: null,
    });
  };

  return {
    ...state,
    sendOTP,
    verifyOTP,
    resetState,
  };
};