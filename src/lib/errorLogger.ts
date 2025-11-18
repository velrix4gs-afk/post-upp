import { supabase } from '@/integrations/supabase/client';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorType = 'network' | 'auth' | 'database' | 'storage' | 'validation' | 'unknown';

interface LogErrorParams {
  type: ErrorType;
  message: string;
  code?: string;
  error?: any;
  severity?: ErrorSeverity;
  componentName?: string;
  metadata?: Record<string, any>;
}

export const logError = async ({
  type,
  message,
  code,
  error,
  severity = 'error',
  componentName,
  metadata = {}
}: LogErrorParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('error_logs').insert({
      user_id: user?.id || null,
      error_type: type,
      error_code: code,
      error_message: message,
      stack_trace: error?.stack || null,
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      component_name: componentName,
      severity,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        errorDetails: error?.message || null
      }
    });
  } catch (logError) {
    // Silently fail - don't disrupt user experience
    console.error('[Error Logger] Failed to log error:', logError);
  }
};

export const isNetworkError = (error: any): boolean => {
  if (!navigator.onLine) return true;
  
  const errorString = error?.message?.toLowerCase() || '';
  return ['fetch', 'network', 'connection', 'timeout', 'abort', 'failed to fetch'].some(
    pattern => errorString.includes(pattern)
  );
};

export const getSimpleErrorMessage = (error: any): string => {
  if (isNetworkError(error)) {
    return 'No internet connection';
  }
  return 'Something went wrong';
};
