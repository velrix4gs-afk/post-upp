import { toast } from '@/hooks/use-toast';

let isOnline = navigator.onLine;
let lastToastTime = 0;
const TOAST_COOLDOWN = 3000; // 3 seconds between toasts

export const initNetworkMonitor = () => {
  window.addEventListener('online', () => {
    isOnline = true;
    const now = Date.now();
    if (now - lastToastTime > TOAST_COOLDOWN) {
      toast({
        title: 'Back online',
        description: 'Connection restored',
        duration: 1000,
      });
      lastToastTime = now;
    }
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    const now = Date.now();
    if (now - lastToastTime > TOAST_COOLDOWN) {
      toast({
        title: 'No internet',
        description: 'You are offline',
        duration: 1000,
      });
      lastToastTime = now;
    }
  });
};

export const isNetworkOnline = () => isOnline;

export const handleNetworkError = (error: any) => {
  console.error('[Network Error]', error);
  
  if (!isOnline) {
    const now = Date.now();
    if (now - lastToastTime > TOAST_COOLDOWN) {
      toast({
        title: 'No internet',
        duration: 1000,
      });
      lastToastTime = now;
    }
    return;
  }
  
  // Don't show error toasts to users, just log
  console.error('[App Error]', error);
};
