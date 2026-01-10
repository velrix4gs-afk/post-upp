import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/premium/VerificationBadge";
import { UserPlus, UserCheck, MessageCircle, MapPin, Link2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useFollowers } from "@/hooks/useFollowers";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FollowersDialog } from "@/components/FollowersDialog";

interface MiniProfilePopupProps {
  userId: string;
  onClose?: () => void;
}

export const MiniProfilePopup = ({ userId, onClose }: MiniProfilePopupProps) => {
  const { user } = useAuth();
  const { profile, loading } = useProfile(userId);
  // Get the target user's followers/following for stats
  const { followers: targetFollowers, following: targetFollowing, followUser, unfollowUser } = useFollowers(userId);
  // Get the current viewer's following to check if we're following this user
  const { following: viewerFollowing } = useFollowers(user?.id);
  const { posts } = usePosts();
  const navigate = useNavigate();

  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);

  const isOwnProfile = userId === user?.id;
  // Check if the current viewer is following this user
  const isFollowing = viewerFollowing.some(f => f.following_id === userId);
  const userPostsCount = posts.filter(p => p.user_id === userId).length;

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

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

  // Build user lists for dialogs
  const followerUsers = targetFollowers
    .filter(f => f.follower)
    .map(f => ({
      id: f.follower_id,
      username: f.follower?.username || '',
      display_name: f.follower?.display_name || '',
      avatar_url: f.follower?.avatar_url,
      is_verified: f.follower?.is_verified
    }));

  const followingUsers = targetFollowing
    .filter(f => f.following)
    .map(f => ({
      id: f.following_id,
      username: f.following?.username || '',
      display_name: f.following?.display_name || '',
      avatar_url: f.following?.avatar_url,
      is_verified: f.following?.is_verified
    }));

  if (loading) {
    return (
      <Card className="w-80 overflow-hidden shadow-2xl border-border/30 backdrop-blur-xl bg-card animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Gradient Header Skeleton */}
        <div className="h-20 bg-gradient-to-r from-primary/40 to-accent/40" />
        <div className="px-6 pb-6">
          {/* Avatar Skeleton */}
          <div className="flex justify-center -mt-12 mb-4">
            <Skeleton className="h-24 w-24 rounded-full border-4 border-card" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton className="h-5 w-32 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (!profile) return null;

  return (
    <>
      <Card 
        className="w-80 overflow-hidden border-border/30 shadow-2xl mini-profile-popup animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Header */}
        <div className="h-20 bg-gradient-to-r from-primary via-primary/90 to-accent relative">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.2) 0%, transparent 40%)'
          }} />
        </div>

        <div className="px-6 pb-6">
          {/* Centered Avatar */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="relative">
              <Avatar 
                className="h-24 w-24 border-4 border-card ring-4 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all shadow-xl" 
                onClick={handleViewProfile}
              >
                <AvatarImage src={profile.avatar_url} alt={profile.display_name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-muted to-muted-foreground/20 text-muted-foreground text-2xl font-bold">
                  {profile.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 shadow-md">
                  <VerificationBadge 
                    isVerified={profile.is_verified}
                    verificationType={profile.verification_type}
                    className="!w-5 !h-5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Name and Username */}
          <div className="text-center mb-3">
            <h3 
              className="font-bold text-lg flex items-center justify-center gap-1.5 cursor-pointer hover:underline"
              onClick={handleViewProfile}
            >
              {profile.display_name}
              {profile.is_verified && (
                <VerificationBadge 
                  isVerified={profile.is_verified}
                  verificationType={profile.verification_type}
                  className="!w-5 !h-5"
                />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-center text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
              {profile.bio}
            </p>
          )}

          {/* Location & Website */}
          {(profile.location || profile.website) && (
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-4 flex-wrap">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[120px]">
                    {profile.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </span>
                </a>
              )}
            </div>
          )}

          {/* Stats Row - Clickable */}
          <div className="flex items-center justify-center gap-8 mb-5">
            <button 
              className="text-center hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowFollowingDialog(true);
              }}
            >
              <div className="font-bold text-lg text-foreground">{formatCount(targetFollowing.length)}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </button>
            <button 
              className="text-center hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setShowFollowersDialog(true);
              }}
            >
              <div className="font-bold text-lg text-foreground">{formatCount(targetFollowers.length)}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </button>
            <button 
              className="text-center hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors"
              onClick={handleViewProfile}
            >
              <div className="font-bold text-lg text-foreground">{formatCount(userPostsCount)}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </button>
          </div>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <div className="flex gap-3">
              <Button
                onClick={handleFollowToggle}
                className="flex-1 h-10 font-semibold rounded-full"
                variant={isFollowing ? "outline" : "default"}
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
              <Button
                onClick={handleMessage}
                variant="outline"
                className="flex-1 h-10 font-semibold rounded-full"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          )}

          {isOwnProfile && (
            <Button
              onClick={handleViewProfile}
              variant="outline"
              className="w-full h-10 font-semibold rounded-full"
            >
              View Full Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Followers Dialog */}
      <FollowersDialog
        open={showFollowersDialog}
        onClose={() => setShowFollowersDialog(false)}
        users={followerUsers}
        title="Followers"
      />

      {/* Following Dialog */}
      <FollowersDialog
        open={showFollowingDialog}
        onClose={() => setShowFollowingDialog(false)}
        users={followingUsers}
        title="Following"
      />
    </>
  );
};