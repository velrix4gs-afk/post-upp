import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Home, MessageCircle, PlusCircle, Bell, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreatePost from './CreatePost';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [showCreatePost, setShowCreatePost] = useState(false);

  // Hide bottom nav on auth pages
  const authPages = ['/auth', '/signin', '/signup', '/forgot-password'];
  const isAuthPage = authPages.some(page => location.pathname.startsWith(page));
  
  if (!user || isAuthPage) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: 'Feed',
      icon: Home,
      path: '/feed',
      isActive: isActive('/feed') || location.pathname === '/',
    },
    {
      label: 'Messages',
      icon: MessageCircle,
      path: '/messages',
      isActive: isActive('/messages'),
      badge: 3, // You can connect this to actual unread messages count
    },
    {
      label: 'Create',
      icon: PlusCircle,
      action: () => setShowCreatePost(true),
      isCenter: true,
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/feed', // Opens notification panel
      action: () => {}, // Will be handled separately
      isActive: false,
      badge: unreadCount,
    },
    {
      label: 'Profile',
      icon: User,
      path: `/profile/${user.id}`,
      isActive: location.pathname.startsWith('/profile'),
    },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t shadow-lg">
        <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActiveTab = item.isActive;

            if (item.isCenter) {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex flex-col items-center justify-center relative -mt-6"
                >
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200">
                    <Icon className="h-6 w-6 text-primary-foreground" />
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
                className={`flex flex-col items-center justify-center flex-1 py-2 px-1 relative transition-all duration-300 ${
                  isActiveTab 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 transition-all duration-300 ${
                    isActiveTab ? 'scale-110' : 'scale-100'
                  }`} />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center text-[10px] animate-pulse"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                  {isActiveTab && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${
                  isActiveTab ? 'opacity-100' : 'opacity-70'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Spacer for content to not be hidden behind bottom nav */}
      <div className="md:hidden h-16" />

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
