import { useState, useEffect, useCallback } from 'react';
import { Image, MapPin, Smile, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import CreatePostSimple from './CreatePostSimple';
import { cn } from '@/lib/utils';

export const FixedPostBar = () => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Auto-hide after 3 seconds of no interaction
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(hideTimer);
  }, [lastInteraction]);

  // Show bar on any user interaction
  const handleInteraction = useCallback(() => {
    setIsVisible(true);
    setLastInteraction(Date.now());
  }, []);

  // Listen for scroll, touch, and mouse events
  useEffect(() => {
    const events = ['scroll', 'touchstart', 'touchmove', 'mousemove', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [handleInteraction]);

  return (
    <>
      <div
        className={cn(
          "fixed left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border transition-all duration-300 ease-in-out md:hidden",
          isVisible 
            ? "bottom-20 opacity-100 translate-y-0" 
            : "bottom-20 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          {/* Quick action buttons */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setShowCreatePost(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Image className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowCreatePost(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <MapPin className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowCreatePost(true)}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>

          {/* Text input area */}
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm text-muted-foreground text-left hover:bg-muted transition-colors"
          >
            What's on your mind?
          </button>

          {/* Post button */}
          <Button
            size="sm"
            onClick={() => setShowCreatePost(true)}
            className="rounded-full h-9 w-9 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create Post Drawer (Bottom Sheet) */}
      <Drawer open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b border-border/50">
            <DrawerTitle className="text-center">Create Post</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <CreatePostSimple onSuccess={() => setShowCreatePost(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
