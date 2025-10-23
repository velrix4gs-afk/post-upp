import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Heart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { showCleanError } from '@/lib/errorHandler';

interface TipDialogProps {
  recipientId: string;
  recipientName: string;
}

export const TipDialog = ({ recipientId, recipientName }: TipDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('5');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedAmounts = ['5', '10', '20', '50'];

  const handleSendTip = async () => {
    if (!user) {
      toast({
        title: '⚠️ AUTH_001',
        description: 'Please sign in to send tips',
        variant: 'destructive'
      });
      return;
    }

    // Check if sender is verified
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single();

    if (!profile?.is_verified) {
      toast({
        title: '⚠️ TIP_005',
        description: 'You must be verified to send tips. Visit /verification to get verified!',
        variant: 'destructive',
        duration: 8000
      });
      // Redirect after showing toast
      setTimeout(() => {
        window.location.href = '/verification';
      }, 2000);
      return;
    }

    const tipAmount = parseFloat(amount);
    if (isNaN(tipAmount) || tipAmount <= 0) {
      toast({
        title: '⚠️ TIP_001',
        description: 'Please enter a valid amount (minimum $1)',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('process-tip', {
        body: {
          recipient_id: recipientId,
          amount: tipAmount,
          message: message.trim() || null
        }
      });

      if (error) throw error;

      toast({
        title: '✅ Success',
        description: `You sent $${tipAmount} to ${recipientName}`,
        duration: 5000
      });

      setOpen(false);
      setAmount('5');
      setMessage('');
    } catch (err: any) {
      console.error('[TIP_002] Error sending tip:', err);
      showCleanError(err, toast, 'Tip Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4 mr-2" />
          Tip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Send a Tip to {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {predefinedAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === amt ? 'default' : 'outline'}
                  onClick={() => setAmount(amt)}
                  type="button"
                >
                  ${amt}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Enter custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Input
              placeholder="Add a nice message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSendTip} disabled={loading} className="flex-1">
              {loading ? 'Processing...' : `Send $${amount || '0'}`}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
