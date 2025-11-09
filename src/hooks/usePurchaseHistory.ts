import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PurchaseRecord {
  id: string;
  user_id: string;
  purchase_type: 'premium_basic' | 'premium_pro' | 'premium_elite' | 'verification_badge';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  features: string[];
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export const usePurchaseHistory = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('purchase_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Map data to ensure proper typing
      const mappedData: PurchaseRecord[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        purchase_type: item.purchase_type as PurchaseRecord['purchase_type'],
        amount: item.amount,
        currency: item.currency,
        status: item.status as PurchaseRecord['status'],
        features: Array.isArray(item.features) ? item.features as string[] : [],
        payment_reference: item.payment_reference,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setPurchases(mappedData);
    } catch (err: any) {
      console.error('[PURCHASE_HISTORY_001] Error fetching purchases:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [user?.id]);

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchases
  };
};
