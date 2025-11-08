import { useEffect } from 'react';
import { toast } from './use-toast';

export const useScreenshotDetection = (enabled: boolean = false, onScreenshot?: () => void) => {
  useEffect(() => {
    if (!enabled) return;

    // Note: This detection is not foolproof and can be easily bypassed
    // It only catches keyboard shortcuts, not actual screenshots
    
    // Detect screenshot attempts (keyboard shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows: Win + PrintScreen, PrintScreen
      if (e.key === 'PrintScreen' || (e.metaKey && e.key === 'PrintScreen')) {
        toast({
          title: 'Privacy reminder',
          description: 'Please respect the privacy of this conversation',
        });
        onScreenshot?.();
      }
      
      // Mac: Cmd + Shift + 3/4/5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        toast({
          title: 'Privacy reminder',
          description: 'Please respect the privacy of this conversation',
        });
        onScreenshot?.();
      }
    };

    // Detect visibility change (may indicate screenshot tool)
    // Note: This only detects tab switching, not actual screenshots
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Potentially switching tabs
        const wasHiddenRecently = sessionStorage.getItem('was_hidden');
        if (!wasHiddenRecently) {
          sessionStorage.setItem('was_hidden', Date.now().toString());
        }
      } else {
        const wasHidden = sessionStorage.getItem('was_hidden');
        if (wasHidden) {
          const timeDiff = Date.now() - parseInt(wasHidden);
          if (timeDiff < 2000) { // Came back within 2 seconds
            // This may be a screenshot but could also be normal tab switching
            onScreenshot?.();
          }
          sessionStorage.removeItem('was_hidden');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, onScreenshot]);
};
