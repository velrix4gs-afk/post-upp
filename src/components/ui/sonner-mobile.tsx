import { useEffect } from 'react';
import { Toaster as Sonner, toast } from 'sonner';
import { X } from 'lucide-react';

// Auto-dismiss duration in milliseconds
const AUTO_DISMISS_DURATION = 2000;

// Override default toast to add swipe-to-dismiss and auto-close
export function ToasterMobile() {
  useEffect(() => {
    // Override toast dismiss duration
    const originalToast = toast;
    const enhancedToast = (...args: Parameters<typeof toast>) => {
      const result = originalToast(...args);
      return result;
    };
    
    // Copy all toast methods
    Object.assign(enhancedToast, originalToast);
  }, []);

  return (
    <Sonner
      position="top-center"
      toastOptions={{
        duration: AUTO_DISMISS_DURATION,
        classNames: {
          toast: 'group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:cursor-grab active:group-[.toaster]:cursor-grabbing',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          closeButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80',
        },
      }}
      closeButton
      richColors
      expand
    />
  );
}
