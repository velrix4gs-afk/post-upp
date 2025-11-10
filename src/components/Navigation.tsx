import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import ThemeToggle from './ThemeToggle';
import { CoinsDisplay } from './CoinsDisplay';
import { Home, Calendar, User, Bell, Menu, LogOut, Search, MessageCircle, Users, UsersRound, Compass, Bookmark, BarChart3, Settings, Star, Crown, BadgeCheck, FileText, Receipt, HelpCircle, Shield, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
                <Link to="/pages">
                  <Button 
                    variant={isActive('/pages') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Pages
                  </Button>
                </Link>
                <Link to="/reels">
                  <Button 
                    variant={isActive('/reels') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Reels
                  </Button>
                </Link>
                <Link to="/verification">
                  <Button 
                    variant={isActive('/verification') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Verify
                  </Button>
                </Link>
                <Link to="/premium">
                  <Button 
                    variant={isActive('/premium') ? 'default' : 'ghost'} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    Premium
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
                  <DropdownMenuContent align="end" className="w-96 p-2 bg-background shadow-lg">
                    {/* Profile Section */}
                    <div 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors mb-2"
                      onClick={() => navigate(`/profile/${user.id}`)}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="text-base">{profile?.display_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base truncate text-foreground">{profile?.display_name || 'User'}</p>
                        <p className="text-sm text-muted-foreground truncate">@{profile?.username || 'username'}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Shortcuts Section */}
                    <div className="space-y-1">
                      <DropdownMenuItem 
                        onClick={() => navigate('/messages')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Messages</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/friends')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Users className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Friends</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/groups')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <UsersRound className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Groups</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/events')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Events</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/explore')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Compass className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Explore</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/bookmarks')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Bookmark className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Saved</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/pages')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <FileText className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Pages</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/reels')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors lg:hidden"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Star className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Reels</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/dashboard')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Home className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Dashboard</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/analytics')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <BarChart3 className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Analytics</span>
                        </div>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Premium & Verification */}
                    <div className="space-y-1">
                      <DropdownMenuItem 
                        onClick={() => navigate('/verification')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <BadgeCheck className="h-5 w-5 text-warning" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Get Verified</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/premium')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Crown className="h-5 w-5 text-warning" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Go Premium</span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        onClick={() => navigate('/purchases')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Receipt className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Purchase History</span>
                        </div>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Settings & Privacy */}
                    <div className="space-y-1">
                      <DropdownMenuItem 
                        onClick={() => navigate('/settings')} 
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Settings className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Settings & Privacy</span>
                        </div>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Help & Support */}
                    <div className="space-y-1">
                      <DropdownMenuItem 
                        onClick={() => window.open('https://docs.lovable.dev', '_blank')}
                        className="p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <HelpCircle className="h-5 w-5 text-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">Help & Support</span>
                        </div>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-2" />

                    {/* Logout */}
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="p-3 rounded-lg cursor-pointer hover:bg-destructive/10 transition-colors"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                          <LogOut className="h-5 w-5 text-destructive" />
                        </div>
                        <span className="text-sm font-medium text-destructive">Log Out</span>
                      </div>
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