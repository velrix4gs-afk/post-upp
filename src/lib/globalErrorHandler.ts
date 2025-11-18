import { logError, getSimpleErrorMessage, isNetworkError } from './errorLogger';
import { toast } from 'sonner';

// Global error handler setup
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    
    const error = event.reason;
    
    // Log to backend
    logError({
      type: isNetworkError(error) ? 'network' : 'unknown',
      message: error?.message || 'Unhandled promise rejection',
      error,
      severity: 'error',
      componentName: 'GlobalErrorHandler'
    });

    // Show simple toast
    if (!isNetworkError(error)) {
      toast.error(getSimpleErrorMessage(error), {
        duration: 1000
      });
    }
  });

  // Handle runtime errors
  window.addEventListener('error', (event) => {
    event.preventDefault();
    
    const error = event.error;
    
    // Log to backend
    logError({
      type: 'unknown',
      message: event.message,
      error,
      severity: 'error',
      componentName: 'GlobalErrorHandler',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });

    // Don't show toast for network errors (handled elsewhere)
    if (!isNetworkError(error)) {
      toast.error('Something went wrong', {
        duration: 1000
      });
    }
  });

  // Handle console errors in production for logging
  if (process.env.NODE_ENV === 'production') {
    const originalError = console.error;
    console.error = (...args) => {
      // Log to backend silently
      logError({
        type: 'unknown',
        message: args.join(' '),
        severity: 'warning',
        componentName: 'ConsoleError'
      });
      
      // Still log to console
      originalError.apply(console, args);
    };
  }
};

// Network status handler
export const setupNetworkStatusHandler = () => {
  let wasOffline = false;

  window.addEventListener('offline', () => {
    wasOffline = true;
    toast.error('No internet connection', {
      duration: 1000
    });
  });

  window.addEventListener('online', () => {
    if (wasOffline) {
      toast.success('Back online', {
        duration: 1000
      });
      wasOffline = false;
    }
  });
};
