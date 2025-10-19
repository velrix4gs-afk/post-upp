import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import ThemeToggle from './ThemeToggle';
import { Home, Calendar, User, Bell, Menu, LogOut, Search, MessageCircle, Users, UsersRound, Compass, Bookmark, BarChart3, Settings, Star } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import NotificationCenter from './NotificationCenter';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/feed" className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
              POST UP
            </Link>
            
            {user && (
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/feed">
                  <Button 
                    variant={isActive('/feed') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Feed
                  </Button>
                </Link>
                <Link to="/messages">
                  <Button 
                    variant={isActive('/messages') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2 relative"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Messages
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      3
                    </Badge>
                  </Button>
                </Link>
                <Link to="/friends">
                  <Button 
                    variant={isActive('/friends') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Friends
                  </Button>
                </Link>
                <Link to="/groups">
                  <Button 
                    variant={isActive('/groups') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <UsersRound className="h-4 w-4" />
                    Groups
                  </Button>
                </Link>
                <Link to="/events">
                  <Button 
                    variant={isActive('/events') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Events
                  </Button>
                </Link>
                <Link to="/explore">
                  <Button 
                    variant={isActive('/explore') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Compass className="h-4 w-4" />
                    Explore
                  </Button>
                </Link>
                <Link to="/bookmarks">
                  <Button 
                    variant={isActive('/bookmarks') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Bookmark className="h-4 w-4" />
                    Saved
                  </Button>
                </Link>
                <Link to="/verification">
                  <Button 
                    variant={isActive('/verification') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Verify
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {user && (
            <div className="flex md:hidden">
              <Button variant="ghost" size="sm" onClick={() => navigate('/search')}>
                <Search className="h-5 w-5" />
              </Button>
            </div>
          )}

          {user && (
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-9 w-full"
                  onClick={() => navigate('/search')}
                  readOnly
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative"
                  onClick={() => setShowNotifications(true)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>

                <NotificationCenter 
                  isOpen={showNotifications} 
                  onClose={() => setShowNotifications(false)} 
                />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>{profile?.display_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar>
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>{profile?.display_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{profile?.display_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">@{profile?.username || 'username'}</p>
                      </div>
                    </div>
                    <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <Home className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/analytics')}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      <span>Analytics</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/search')} className="md:hidden">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;