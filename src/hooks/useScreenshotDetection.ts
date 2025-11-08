import { useEffect } from 'react';
import { toast } from './use-toast';

export const useScreenshotDetection = (enabled: boolean = false, onScreenshot?: () => void) => {
  useEffect(() => {
    if (!enabled) return;

    // Detect screenshot attempts (keyboard shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Windows: Win + PrintScreen, PrintScreen
      if (e.key === 'PrintScreen' || (e.metaKey && e.key === 'PrintScreen')) {
        toast({
          title: 'Screenshot detected',
          description: 'The other person will be notified',
        });
        onScreenshot?.();
      }
      
      // Mac: Cmd + Shift + 3/4/5
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        toast({
          title: 'Screenshot detected',
          description: 'The other person will be notified',
        });
        onScreenshot?.();
      }
    };

    // Detect visibility change (may indicate screenshot tool)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Potentially taking screenshot
        const wasHiddenRecently = sessionStorage.getItem('was_hidden');
        if (!wasHiddenRecently) {
          sessionStorage.setItem('was_hidden', Date.now().toString());
        }
      } else {
        const wasHidden = sessionStorage.getItem('was_hidden');
        if (wasHidden) {
          const timeDiff = Date.now() - parseInt(wasHidden);
          if (timeDiff < 2000) { // Came back within 2 seconds
            toast({
              title: 'Potential screenshot detected',
              description: 'The other person may be notified',
              variant: 'default',
            });
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
