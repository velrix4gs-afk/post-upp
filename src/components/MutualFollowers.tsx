import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useFollowers } from "@/hooks/useFollowers";
import { useProfile } from "@/hooks/useProfile";
import { useMemo } from "react";

interface MutualFollowersProps {
  profileUserId: string;
}

export const MutualFollowers = ({ profileUserId }: MutualFollowersProps) => {
  const { user } = useAuth();
  const { followers: profileFollowers } = useFollowers(profileUserId);
  const { following: currentUserFollowing } = useFollowers(user?.id);

  // Find mutual followers (people that both the current user follows AND follow the profile user)
  const mutualFollowers = useMemo(() => {
    if (!user || profileUserId === user.id) return [];
    
    const currentUserFollowingIds = currentUserFollowing.map(f => f.following_id);
    const profileFollowerIds = profileFollowers.map(f => f.follower_id);
    
    // People you follow who also follow this profile
    return profileFollowerIds.filter(id => currentUserFollowingIds.includes(id)).slice(0, 3);
  }, [currentUserFollowing, profileFollowers, user, profileUserId]);

  if (!user || profileUserId === user.id || mutualFollowers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex -space-x-2">
        {mutualFollowers.map((followerId) => (
          <MutualFollowerAvatar key={followerId} userId={followerId} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Followed by{' '}
        <span className="font-medium text-foreground">
          {mutualFollowers.length === 1 
            ? '1 person you follow'
            : `${mutualFollowers.length} people you follow`
          }
        </span>
      </p>
    </div>
  );
};

const MutualFollowerAvatar = ({ userId }: { userId: string }) => {
  const { profile } = useProfile(userId);

  return (
    <Avatar className="h-5 w-5 border-2 border-background">
      <AvatarImage src={profile?.avatar_url} alt={profile?.display_name} className="object-cover" />
      <AvatarFallback className="text-[8px] bg-muted">
        {profile?.display_name?.[0] || 'U'}
      </AvatarFallback>
    </Avatar>
  );
};
