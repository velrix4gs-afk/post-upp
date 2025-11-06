import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

interface VerificationCode {
  id: string;
  code: string;
  user_id: string | null;
  status: string;
  created_at: string;
  issued_at: string | null;
  used_at: string | null;
  used_by: string | null;
  purchased_at: string | null;
  op_notes: string | null;
  user_display_name?: string;
  user_username?: string;
}

export const VerificationCodes = () => {
  const [codes, setCodes] = useState<VerificationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [generateCount, setGenerateCount] = useState(10);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<VerificationCode | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, [statusFilter]);

  const fetchCodes = async () => {
    try {
      let query = supabase
        .from('verification_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch profile data for users
      const codesWithProfiles = await Promise.all((data || []).map(async (code) => {
        if (code.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, username')
            .eq('id', code.user_id)
            .single();
          
          return {
            ...code,
            user_display_name: profile?.display_name,
            user_username: profile?.username,
          };
        }
        return code;
      }));
      
      setCodes(codesWithProfiles);
    } catch (error) {
      console.error('Error fetching codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch verification codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async () => {
    try {
      const newCodes = [];
      for (let i = 0; i < generateCount; i++) {
        const { data, error } = await supabase.rpc('generate_verification_code');
        if (error) throw error;
        
        const { error: insertError } = await supabase
          .from('verification_codes')
          .insert({
            code: data,
            status: 'available',
          });

        if (insertError) throw insertError;
        newCodes.push(data);
      }

      toast({
        title: 'Success',
        description: `Generated ${generateCount} verification codes`,
      });

      setShowGenerateDialog(false);
      fetchCodes();
    } catch (error) {
      console.error('Error generating codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate codes',
        variant: 'destructive',
      });
    }
  };

  const revokeCode = async () => {
    if (!selectedCode) return;

    try {
      const { error } = await supabase
        .from('verification_codes')
        .update({
          status: 'revoked',
          op_notes: revokeReason,
        })
        .eq('id', selectedCode.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Verification code revoked',
      });

      setShowRevokeDialog(false);
      setSelectedCode(null);
      setRevokeReason('');
      fetchCodes();
    } catch (error) {
      console.error('Error revoking code:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke code',
        variant: 'destructive',
      });
    }
  };

  const filteredCodes = codes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.user_display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      available: 'secondary',
      issued: 'default',
      used: 'outline',
      revoked: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Verification Codes</h1>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Codes
            </Button>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="issued">Issued</option>
                <option value="used">Used</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned User</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono">{code.code}</TableCell>
                      <TableCell>{getStatusBadge(code.status)}</TableCell>
                      <TableCell>
                        {code.user_display_name ? (
                          <div>
                            <div className="font-medium">{code.user_display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              @{code.user_username}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(code.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {code.issued_at
                          ? format(new Date(code.issued_at), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {code.used_at
                          ? format(new Date(code.used_at), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {code.status !== 'revoked' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedCode(code);
                              setShowRevokeDialog(true);
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Verification Codes</DialogTitle>
            <DialogDescription>
              Create new verification codes that can be assigned to users
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="count">Number of codes to generate</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="100"
              value={generateCount}
              onChange={(e) => setGenerateCount(parseInt(e.target.value) || 1)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={generateCodes}>Generate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Verification Code</DialogTitle>
            <DialogDescription>
              This will permanently revoke the code: {selectedCode?.code}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Reason for revocation</Label>
            <Textarea
              id="reason"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Enter reason..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={revokeCode}>
              Revoke Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
