import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface VerificationBadgeProps {
  isVerified?: boolean;
  verificationType?: string | null;
  verifiedAt?: string | null;
  className?: string;
}

export const VerificationBadge = ({ 
  isVerified = false, 
  verificationType, 
  verifiedAt,
  className = '' 
}: VerificationBadgeProps) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!isVerified) return null;

  return (
    <>
      <span 
        className={`verified verified--solid show tooltip ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(true);
        }}
        style={{ cursor: 'pointer' }}
      >
        <span className="tooltiptext">Verified account</span>
      </span>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="verified verified--solid show" />
              Verified Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This account is verified and authentic.
            </p>
            {verificationType && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Verification Type</p>
                <p className="text-sm capitalize">{verificationType}</p>
              </div>
            )}
            {verifiedAt && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Verified On</p>
                <p className="text-sm">{format(new Date(verifiedAt), 'MMMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
