import { useEffect } from 'react';
import { toast } from 'sonner';
import { logError, isNetworkError, getSimpleErrorMessage } from '@/lib/errorLogger';

interface SimpleErrorToastProps {
  error: any;
  componentName?: string;
  onDismiss?: () => void;
}

export const showSimpleError = (error: any, componentName?: string) => {
  const message = getSimpleErrorMessage(error);
  
  // Log to backend silently
  logError({
    type: isNetworkError(error) ? 'network' : 'unknown',
    message: error?.message || 'Unknown error',
    error,
    severity: 'error',
    componentName
  });

  // Show simple toast for 1 second
  toast.error(message, {
    duration: 1000,
    style: {
      background: 'hsl(var(--destructive))',
      color: 'hsl(var(--destructive-foreground))',
      border: 'none'
    }
  });
};

export const SimpleErrorToast = ({ error, componentName, onDismiss }: SimpleErrorToastProps) => {
  useEffect(() => {
    if (error) {
      showSimpleError(error, componentName);
      onDismiss?.();
    }
  }, [error, componentName, onDismiss]);

  return null;
};
