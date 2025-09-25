import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Search, 
  Home, 
  Users, 
  MessageCircle, 
  Bell, 
  Settings,
  Menu
} from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
              SocialHub
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
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Home className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Users className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
                <MessageCircle className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-destructive">
                  3
                </Badge>
              </Button>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-primary">
                  7
                </Badge>
              </Button>
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-xs bg-gradient-primary text-white">JD</AvatarFallback>
              </Avatar>
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
              <Button variant="ghost" className="w-full justify-start">
                <Home className="h-5 w-5 mr-3" />
                Home
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-5 w-5 mr-3" />
                Friends
                <Badge className="ml-auto bg-primary">12</Badge>
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <MessageCircle className="h-5 w-5 mr-3" />
                Messages
                <Badge className="ml-auto bg-destructive">3</Badge>
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Bell className="h-5 w-5 mr-3" />
                Notifications
                <Badge className="ml-auto bg-warning">7</Badge>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;