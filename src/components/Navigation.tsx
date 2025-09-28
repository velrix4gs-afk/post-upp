import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Heart, 
  Search, 
  Home, 
  Users, 
  MessageCircle, 
  Bell, 
  Settings,
  Menu,
  User,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNotifications } from "@/hooks/useNotifications";
import { Link, useNavigate } from "react-router-dom";
import NotificationCenter from "./NotificationCenter";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              POST UP
            </span>
          </div>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search friends, posts, groups..." 
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary"
              />
            </div>
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-2">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/friends">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Users className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/events">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                  <Calendar className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
                  <MessageCircle className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-destructive">
                    3
                  </Badge>
                </Button>
              </Link>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-primary">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                <NotificationCenter 
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-10 w-10 p-0"
                onClick={handleSignOut}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Link to="/profile">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-xs bg-gradient-primary text-white">
                    {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden h-10 w-10 p-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-2">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 bg-muted/50 border-0"
                />
              </div>
              
              {/* Mobile Navigation */}
              <Link to="/dashboard">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="h-5 w-5 mr-3" />
                  Home
                </Button>
              </Link>
              <Link to="/friends">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-5 w-5 mr-3" />
                  Friends
                  <Badge className="ml-auto bg-primary">12</Badge>
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant="ghost" className="w-full justify-start">
                  <MessageCircle className="h-5 w-5 mr-3" />
                  Messages
                  <Badge className="ml-auto bg-destructive">3</Badge>
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="h-5 w-5 mr-3" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-auto bg-warning">{unreadCount}</Badge>
                )}
              </Button>
              <Link to="/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <User className="h-5 w-5 mr-3" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                <Settings className="h-5 w-5 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;