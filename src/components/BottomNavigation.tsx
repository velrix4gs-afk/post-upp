import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Home, Search, Bell, MessageCircle, Plus, Film } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreatePost from './CreatePost';
import { cn } from '@/lib/utils';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  // Pages where bottom nav should be shown
  const allowedPages = ['/feed', '/', '/reels'];
  const isAllowedPage = allowedPages.some(page => 
    location.pathname === page || location.pathname.startsWith('/feed')
  );

  // Hide bottom nav on auth pages or non-allowed pages
  const authPages = ['/auth', '/signin', '/signup', '/forgot-password'];
  const isAuthPage = authPages.some(page => location.pathname.startsWith(page));

  // Auto-hide after 2 seconds of no interaction
  useEffect(() => {
    if (!isAllowedPage) return;

    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(hideTimer);
  }, [lastInteraction, isAllowedPage]);

  // Show nav on any user interaction
  const handleInteraction = useCallback(() => {
    setIsVisible(true);
    setLastInteraction(Date.now());
  }, []);

  // Listen for scroll, touch, and mouse events
  useEffect(() => {
    if (!isAllowedPage) return;

    const events = ['scroll', 'touchstart', 'touchmove', 'mousemove', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
    };
  }, [handleInteraction, isAllowedPage]);

  // Don't render if not authenticated, on auth page, or not on allowed pages
  if (!user || isAuthPage || !isAllowedPage) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/feed',
      isActive: isActive('/feed') || location.pathname === '/'
    },
    {
      label: 'Reels',
      icon: Film,
      path: '/reels',
      isActive: isActive('/reels')
    },
    {
      label: 'Create',
      icon: Plus,
      action: () => setShowCreatePost(true),
      isCenter: true
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/notifications',
      isActive: isActive('/notifications')
    },
    {
      label: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      isActive: isActive('/messages'),
      badge: unreadCount
    }
  ];

  return (
    <>
      <nav
        className={cn(
          "md:hidden fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
          isVisible 
            ? "bottom-6 opacity-100 translate-y-0" 
            : "bottom-6 opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-md shadow-lg border border-border/30">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActiveTab = item.isActive;

            if (item.isCenter) {
              return (
                <button
                  key={index}
                  onClick={() => {
                    handleInteraction();
                    item.action?.();
                  }}
                  className="flex items-center justify-center mx-2"
                >
                  <div className="h-11 w-11 rounded-full bg-primary shadow-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200">
                    <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={() => {
                  handleInteraction();
                  if (item.action) {
                    item.action();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "flex items-center justify-center p-3 relative transition-all duration-200 rounded-full",
                  isActiveTab 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-all duration-200",
                      isActiveTab ? "stroke-[2.5px]" : "stroke-[1.5px]"
                    )}
                  />
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
          </DialogHeader>
          <CreatePost />
        </DialogContent>
      </Dialog>
    </>
  );
};
