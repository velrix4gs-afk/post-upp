import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, UserCheck, Users } from 'lucide-react';
import { useFriendSuggestions } from '@/hooks/useFriendSuggestions';
import { useFollowers } from '@/hooks/useFollowers';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileHoverCard } from '@/components/ProfileHoverCard';

const FriendSuggestions = () => {
  const navigate = useNavigate();
  const { suggestions, loading } = useFriendSuggestions();
  const { followUser, unfollowUser, following } = useFollowers();

  const isFollowing = (userId: string) => {
    return following.some(f => f.following?.id === userId);
  };

  const handleFollowToggle = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowing(userId)) {
      await unfollowUser(userId);
    } else {
      await followUser(userId, false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          People You May Know
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Users className="h-5 w-5" />
        People You May Know
      </h3>
      <div className="space-y-3">
        {suggestions.slice(0, 5).map(suggestion => (
          <div 
            key={suggestion.id} 
            className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg cursor-pointer transition-colors"
            onClick={() => navigate(`/profile/${suggestion.id}`)}
          >
            <div className="flex items-center gap-3">
              <ProfileHoverCard userId={suggestion.id}>
                <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={suggestion.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {suggestion.display_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </ProfileHoverCard>
              <div>
                <ProfileHoverCard userId={suggestion.id}>
                  <p className="font-medium text-sm cursor-pointer hover:underline">{suggestion.display_name}</p>
                </ProfileHoverCard>
                <p className="text-xs text-muted-foreground">
                  {suggestion.mutual_friends_count > 0 
                    ? `${suggestion.mutual_friends_count} mutual friend${suggestion.mutual_friends_count > 1 ? 's' : ''}`
                    : 'Suggested for you'
                  }
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant={isFollowing(suggestion.id) ? "outline" : "default"}
              className="gap-1"
              onClick={(e) => handleFollowToggle(suggestion.id, e)}
            >
              {isFollowing(suggestion.id) ? (
                <>
                  <UserCheck className="h-3 w-3" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3" />
                  Follow
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default FriendSuggestions;
