import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Home, Calendar, MessageCircle, Users, UsersRound, 
  Compass, Bookmark, BarChart3, Settings, Star, 
  Crown, BadgeCheck, FileText, Receipt, HelpCircle, 
  LogOut, ChevronRight 
} from 'lucide-react';

interface MenuPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export const MenuPanel = ({ isOpen, onOpenChange, trigger }: MenuPanelProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    onOpenChange(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const MenuItem = ({ 
    icon: Icon, 
    label, 
    onClick, 
    variant = 'default' 
  }: { 
    icon: any; 
    label: string; 
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }) => (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        variant === 'destructive' 
          ? 'hover:bg-destructive/10' 
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={`h-5 w-5 ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`} />
      </div>
      <span className={`text-sm font-medium ${variant === 'destructive' ? 'text-destructive' : 'text-foreground'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent side="right" className="w-96 p-4 overflow-y-auto">
        {/* Profile Section */}
        <div 
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors mb-4"
          onClick={() => handleNavigation(`/profile/${user?.id}`)}
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

        <Separator className="my-4" />

        {/* Shortcuts Section */}
        <div className="space-y-1 mb-4">
          <MenuItem 
            icon={MessageCircle} 
            label="Messages" 
            onClick={() => handleNavigation('/messages')} 
          />
          <MenuItem 
            icon={Users} 
            label="Friends" 
            onClick={() => handleNavigation('/friends')} 
          />
          <MenuItem 
            icon={UsersRound} 
            label="Groups" 
            onClick={() => handleNavigation('/groups')} 
          />
          <MenuItem 
            icon={Calendar} 
            label="Events" 
            onClick={() => handleNavigation('/events')} 
          />
          <MenuItem 
            icon={Compass} 
            label="Explore" 
            onClick={() => handleNavigation('/explore')} 
          />
          <MenuItem 
            icon={Bookmark} 
            label="Saved" 
            onClick={() => handleNavigation('/bookmarks')} 
          />
          <MenuItem 
            icon={FileText} 
            label="Pages" 
            onClick={() => handleNavigation('/pages')} 
          />
          <MenuItem 
            icon={Star} 
            label="Reels" 
            onClick={() => handleNavigation('/reels')} 
          />
          <MenuItem 
            icon={Home} 
            label="Dashboard" 
            onClick={() => handleNavigation('/dashboard')} 
          />
          <MenuItem 
            icon={BarChart3} 
            label="Analytics" 
            onClick={() => handleNavigation('/analytics')} 
          />
        </div>

        <Separator className="my-4" />

        {/* Premium & Verification */}
        <div className="space-y-1 mb-4">
          <div
            onClick={() => handleNavigation('/verification')}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <BadgeCheck className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm font-medium text-foreground">Get Verified</span>
          </div>

          <div
            onClick={() => handleNavigation('/premium')}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <Crown className="h-5 w-5 text-warning" />
            </div>
            <span className="text-sm font-medium text-foreground">Go Premium</span>
          </div>

          <MenuItem 
            icon={Receipt} 
            label="Purchase History" 
            onClick={() => handleNavigation('/purchases')} 
          />
        </div>

        <Separator className="my-4" />

        {/* Settings & Privacy */}
        <div className="space-y-1 mb-4">
          <MenuItem 
            icon={Settings} 
            label="Settings & Privacy" 
            onClick={() => handleNavigation('/settings')} 
          />
        </div>

        <Separator className="my-4" />

        {/* Help & Support */}
        <div className="space-y-1 mb-4">
          <div
            onClick={() => window.open('https://docs.lovable.dev', '_blank')}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Help & Support</span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Logout */}
        <MenuItem 
          icon={LogOut} 
          label="Log Out" 
          onClick={handleSignOut}
          variant="destructive"
        />
      </SheetContent>
    </Sheet>
  );
};
