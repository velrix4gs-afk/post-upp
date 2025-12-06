import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Home, Search, Bell, MessageCircle, User, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreatePost from './CreatePost';
import { cn } from '@/lib/utils';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide bottom nav on auth pages
  const authPages = ['/auth', '/signin', '/signup', '/forgot-password'];
  const isAuthPage = authPages.some(page => location.pathname.startsWith(page));
  
  if (!user || isAuthPage) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/feed',
      isActive: isActive('/feed') || location.pathname === '/',
    },
    {
      label: 'Search',
      icon: Search,
      path: '/search',
      isActive: isActive('/search'),
    },
    {
      label: 'Create',
      icon: Plus,
      action: () => setShowCreatePost(true),
      isCenter: true,
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/notifications',
      isActive: isActive('/notifications'),
    },
    {
      label: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      isActive: isActive('/messages'),
      badge: unreadCount,
    },
  ];

  return (
    <>
      <nav className={cn(
        "md:hidden fixed left-0 right-0 z-50 bg-background/98 backdrop-blur-xl border-t border-border/50 transition-all duration-300",
        isScrolled ? "bottom-0" : "bottom-0"
      )}>
        <div className="flex items-center justify-around px-2 py-1 safe-area-bottom max-w-md mx-auto">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActiveTab = item.isActive;

            if (item.isCenter) {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex items-center justify-center relative -mt-4"
                >
                  <div className="h-12 w-12 rounded-full bg-primary shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200">
                    <Icon className="h-6 w-6 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </button>
              );
            }

            return (
              <button
                key={index}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 relative transition-all duration-200",
                  isActiveTab 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      isActiveTab ? "stroke-[2.5px]" : "stroke-[1.5px]"
                    )} 
                  />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                {isActiveTab && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                )}
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
