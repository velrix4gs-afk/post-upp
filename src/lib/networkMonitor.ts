import { toast } from '@/hooks/use-toast';
import { flushOfflineQueue, getQueueLength } from '@/lib/offlineQueue';

let isOnline = navigator.onLine;
let lastToastTime = 0;
const TOAST_COOLDOWN = 3000; // 3 seconds between toasts

export const initNetworkMonitor = () => {
  window.addEventListener('online', async () => {
    isOnline = true;
    const now = Date.now();
    const queueLen = getQueueLength();
    if (now - lastToastTime > TOAST_COOLDOWN) {
      toast({
        title: 'Back online',
        description: queueLen > 0 ? `Syncing ${queueLen} pending actions...` : 'Connection restored',
        duration: 2000,
      });
      lastToastTime = now;
    }
    // Flush offline queue on reconnect
    if (queueLen > 0) {
      const result = await flushOfflineQueue();
      if (result.processed > 0) {
        toast({
          title: 'Synced',
          description: `${result.processed} action${result.processed > 1 ? 's' : ''} sent successfully`,
          duration: 2000,
        });
      }
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
