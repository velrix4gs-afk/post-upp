import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VerificationBadge } from "@/components/premium/VerificationBadge";
import { UserPlus, UserCheck, Camera } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useFollowers } from "@/hooks/useFollowers";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface ProfilePreviewCardProps {
  userId: string;
  onClose?: () => void;
}

export const ProfilePreviewCard = ({ userId, onClose }: ProfilePreviewCardProps) => {
  const { user } = useAuth();
  const { profile, loading } = useProfile(userId);
  const { followers, following, followUser, unfollowUser } = useFollowers(userId);
  const { posts } = usePosts();
  const navigate = useNavigate();

  const isOwnProfile = userId === user?.id;
  const isFollowing = following.some(f => f.following_id === userId);
  const userPostsCount = posts.filter(p => p.user_id === userId).length;

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing) {
      await unfollowUser(userId);
    } else {
      await followUser(userId, profile?.is_private || false);
    }
  };

  const handleProfileClick = () => {
    navigate(`/profile/${userId}`);
    onClose?.();
  };

  if (loading) {
    return (
      <Card className="w-80 overflow-hidden shadow-2xl border-border/50">
        <div className="relative h-24 bg-gradient-to-r from-primary/20 to-primary/40">
          <Skeleton className="absolute -bottom-10 left-4 h-20 w-20 rounded-full border-4 border-background" />
        </div>
        <div className="p-4 pt-12">
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <Card 
      className="w-80 overflow-hidden shadow-2xl border-border/50 cursor-pointer hover:shadow-glow transition-all duration-300"
      onClick={handleProfileClick}
    >
      {/* Cover Photo */}
      <div className="relative h-24 bg-gradient-to-r from-primary to-primary-foreground">
        {profile.cover_url ? (
          <img 
            src={profile.cover_url} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
            <Camera className="h-8 w-8 text-primary opacity-30" />
          </div>
        )}
        
        {/* Profile Picture */}
        <div className="absolute -bottom-10 left-4">
          <Avatar className="h-20 w-20 border-4 border-background ring-2 ring-primary/20">
            <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            <AvatarFallback className="bg-gradient-primary text-white text-xl">
              {profile.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          {profile.is_verified && (
            <div className="absolute -bottom-1 -right-1">
              <VerificationBadge 
                isVerified={profile.is_verified}
                verificationType={profile.verification_type}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-12">
        {/* Name and Username */}
        <div className="mb-3">
          <h3 className="text-lg font-bold flex items-center gap-1.5">
            {profile.display_name}
          </h3>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {profile.bio}
          </p>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="text-xl font-bold">{following.length}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
          <div className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="text-xl font-bold">{followers.length}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="text-xl font-bold">{userPostsCount}</div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
        </div>

        {/* Follow Button */}
        {!isOwnProfile && (
          <Button
            className="w-full rounded-lg"
            variant={isFollowing ? "outline" : "default"}
            onClick={handleFollowToggle}
          >
            {isFollowing ? (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Following
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Follow
              </>
            )}
          </Button>
        )}

        {/* Tabs Navigation */}
        <Tabs defaultValue="posts" className="mt-4">
          <TabsList className="grid w-full grid-cols-4 h-9">
            <TabsTrigger value="posts" className="text-xs">Posts</TabsTrigger>
            <TabsTrigger value="replies" className="text-xs">Replies</TabsTrigger>
            <TabsTrigger value="media" className="text-xs">Media</TabsTrigger>
            <TabsTrigger value="likes" className="text-xs">Likes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </Card>
  );
};
