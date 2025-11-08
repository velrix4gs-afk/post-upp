import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Copy, Check, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface VerificationCode {
  id: string;
  code: string;
  status: string;
  user_id: string | null;
  created_at: string;
  used_at: string | null;
  issued_at: string;
  purchased_at: string;
  used_by: string;
  op_notes: string;
}

export default function VerificationCodes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [codes, setCodes] = useState<VerificationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
    fetchCodes();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (error || !data) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to access this page',
        variant: 'destructive'
      });
      navigate('/');
    }
  };

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCodes((data || []) as VerificationCode[]);
    } catch (error) {
      console.error('Error fetching codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification codes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async () => {
    if (quantity < 1 || quantity > 100) {
      toast({
        title: 'Invalid Quantity',
        description: 'Please enter a number between 1 and 100',
        variant: 'destructive'
      });
      return;
    }

    setGenerating(true);
    try {
      const newCodes = [];
      for (let i = 0; i < quantity; i++) {
        const { data: codeStr, error } = await supabase.rpc('generate_verification_code');
        if (error) throw error;
        
        const { data: code, error: insertError } = await supabase
          .from('verification_codes')
          .insert({
            code: codeStr,
            status: 'issued'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        newCodes.push(code);
      }

      toast({
        title: 'Success',
        description: `Generated ${quantity} verification code(s)`,
      });

      fetchCodes();
      setQuantity(1);
    } catch (error) {
      console.error('Error generating codes:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate verification codes',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const revokeCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('verification_codes')
        .update({ status: 'revoked' })
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: 'Code Revoked',
        description: 'The verification code has been revoked',
      });

      fetchCodes();
    } catch (error) {
      console.error('Error revoking code:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke code',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: 'Copied',
      description: 'Code copied to clipboard',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'issued':
        return <Badge variant="default">Issued</Badge>;
      case 'used':
        return <Badge variant="secondary">Used</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Verification Code Management</h1>
          <p className="text-muted-foreground">
            Generate and manage verification codes for users
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate New Codes</CardTitle>
            <CardDescription>
              Create verification codes that users can redeem to get verified
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-2 block">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="Enter quantity"
                />
              </div>
              <Button
                onClick={generateCodes}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Codes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Codes</CardTitle>
            <CardDescription>
              All generated verification codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Used By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Used At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No verification codes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    codes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[150px]">{code.code}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(code.code)}
                            >
                              {copiedCode === code.code ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(code.status)}</TableCell>
                        <TableCell>
                          {code.user_id ? (
                            <span className="text-sm">User #{code.user_id.substring(0, 8)}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(code.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {code.used_at ? new Date(code.used_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {code.status === 'issued' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <X className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke Verification Code</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to revoke this code? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => revokeCode(code.id)}>
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
