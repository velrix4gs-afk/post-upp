import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { UserPlus, UserMinus, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChats } from "@/hooks/useChats";

interface User {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface FollowersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  followers: User[];
  following: User[];
  onFollowToggle: (userId: string, isFollowing: boolean) => Promise<void>;
  followingIds: string[];
}

export const FollowersDialog = ({
  isOpen,
  onClose,
  followers,
  following,
  onFollowToggle,
  followingIds
}: FollowersDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createChat } = useChats();

  const handleMessage = async (userId: string) => {
    try {
      const chatId = await createChat(userId);
      navigate(`/messages?chat=${chatId}`);
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const UserCard = ({ userData, showFollowButton = true }: { userData: User; showFollowButton?: boolean }) => {
    const isFollowing = followingIds.includes(userData.id);
    const isCurrentUser = user?.id === userData.id;

    return (
      <div className="flex items-center justify-between p-3 hover:bg-accent/50 rounded-lg transition-colors">
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => {
            navigate(`/profile/${userData.id}`);
            onClose();
          }}
        >
          <Avatar className="h-12 w-12">
            <AvatarImage src={userData.avatar_url} alt={userData.display_name} />
            <AvatarFallback>{userData.display_name[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{userData.display_name}</p>
            <p className="text-xs text-muted-foreground truncate">@{userData.username}</p>
          </div>
        </div>
        {!isCurrentUser && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMessage(userData.id)}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            {showFollowButton && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={() => onFollowToggle(userData.id, isFollowing)}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connections</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="followers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">
              Followers ({followers.length})
            </TabsTrigger>
            <TabsTrigger value="following">
              Following ({following.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="followers" className="mt-4 max-h-[400px] overflow-y-auto">
            {followers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No followers yet
              </div>
            ) : (
              <div className="space-y-1">
                {followers.map((follower) => (
                  <UserCard key={follower.id} userData={follower} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="following" className="mt-4 max-h-[400px] overflow-y-auto">
            {following.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Not following anyone yet
              </div>
            ) : (
              <div className="space-y-1">
                {following.map((user) => (
                  <UserCard key={user.id} userData={user} showFollowButton={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
