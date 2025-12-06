import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/premium/VerificationBadge";
import { UserPlus, UserCheck, MessageCircle, User } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useFollowers } from "@/hooks/useFollowers";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MiniProfilePopupProps {
  userId: string;
  onClose?: () => void;
}

export const MiniProfilePopup = ({ userId, onClose }: MiniProfilePopupProps) => {
  const { user } = useAuth();
  const { profile, loading } = useProfile(userId);
  const { followers, following, followUser, unfollowUser } = useFollowers(userId);
  const navigate = useNavigate();

  const isOwnProfile = userId === user?.id;
  const isFollowing = following.some(f => f.following_id === userId);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId, profile?.is_private || false);
    }
  };

  const handleMessage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      const { data: chatId, error } = await supabase.rpc('create_private_chat', {
        _user1: user.id,
        _user2: userId
      });

      if (error) throw error;
      
      navigate(`/messages?chat=${chatId}`);
      onClose?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive'
      });
    }
  };

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
    onClose?.();
  };

  if (loading) {
    return (
      <Card className="w-72 p-4 shadow-2xl border-border/50 backdrop-blur-xl bg-card/98 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <Card 
      className="w-72 overflow-hidden border-border/50 shadow-2xl mini-profile-popup animate-in fade-in-0 zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4">
        {/* Profile Info */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-14 w-14 ring-2 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all" onClick={handleViewProfile}>
            <AvatarImage src={profile.avatar_url} alt={profile.display_name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-lg font-bold">
              {profile.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-sm truncate">{profile.display_name}</h3>
              {profile.is_verified && (
                <VerificationBadge 
                  isVerified={profile.is_verified}
                  verificationType={profile.verification_type}
                  className="!w-4 !h-4"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">@{profile.username}</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <div>
            <span className="font-bold text-foreground">{following.length}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </div>
          <div>
            <span className="font-bold text-foreground">{followers.length}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isOwnProfile && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              onClick={handleFollowToggle}
              className="flex-1 h-8 text-xs font-semibold rounded-full"
            >
              {isFollowing ? (
                <>
                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Follow
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleMessage}
              className="h-8 w-8 p-0 rounded-full"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewProfile}
              className="h-8 w-8 p-0 rounded-full"
            >
              <User className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        
        {isOwnProfile && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewProfile}
            className="w-full h-8 text-xs font-semibold rounded-full"
          >
            <User className="h-3.5 w-3.5 mr-1" />
            View Full Profile
          </Button>
        )}
      </div>
    </Card>
  );
};
