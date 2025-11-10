import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Home, MessageCircle, PlusCircle, Star, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreatePost from './CreatePost';

export const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll for dynamic sizing (must be before early return)
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
  
  // Only show on feed page
  const isFeedPage = location.pathname === '/feed' || location.pathname === '/';
  
  if (!user || isAuthPage || !isFeedPage) {
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
      label: 'Reels',
      icon: Star,
      path: '/reels',
      isActive: isActive('/reels'),
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
      <nav className={`md:hidden fixed left-4 right-4 z-50 bg-background/95 backdrop-blur-xl border shadow-2xl transition-all duration-300 ${
        isScrolled ? 'bottom-2 rounded-2xl py-0.5' : 'bottom-4 rounded-3xl py-1'
      }`}>
        <div className="flex items-center justify-around px-1 safe-area-bottom">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActiveTab = item.isActive;

            if (item.isCenter) {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className={`flex flex-col items-center justify-center relative transition-all duration-300 ${
                    isScrolled ? '-mt-2' : '-mt-3'
                  }`}
                >
                  <div className={`rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 ${
                    isScrolled ? 'h-11 w-11' : 'h-14 w-14'
                  }`}>
                    <Icon className={`text-primary-foreground transition-all duration-300 ${
                      isScrolled ? 'h-5 w-5' : 'h-6 w-6'
                    }`} />
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
                className={`flex flex-col items-center justify-center flex-1 relative transition-all duration-300 ${
                  isScrolled ? 'py-1.5 px-0.5' : 'py-2 px-1'
                } ${
                  isActiveTab 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className={`transition-all duration-300 ${
                    isScrolled ? 'h-4 w-4' : 'h-5 w-5'
                  } ${
                    isActiveTab ? 'scale-110' : 'scale-100'
                  }`} />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className={`absolute -top-1.5 -right-1.5 flex items-center justify-center animate-pulse transition-all duration-300 ${
                        isScrolled ? 'h-3.5 min-w-3.5 px-0.5 text-[8px]' : 'h-4 min-w-4 px-1 text-[10px]'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                  {isActiveTab && (
                    <div className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-primary animate-pulse transition-all duration-300 ${
                      isScrolled ? '-bottom-1 w-0.5 h-0.5' : '-bottom-1.5 w-1 h-1'
                    }`} />
                  )}
                </div>
                {!isScrolled && (
                  <span className={`text-[10px] mt-1 font-medium transition-all duration-300 ${
                    isActiveTab ? 'opacity-100' : 'opacity-70'
                  }`}>
                    {item.label}
                  </span>
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
