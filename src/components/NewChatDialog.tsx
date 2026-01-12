import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useFollowers } from '@/hooks/useFollowers';
import { useAuth } from '@/hooks/useAuth';
import { VerificationBadge } from './premium/VerificationBadge';

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectFriend: (friendId: string) => void;
}

export const NewChatDialog = ({ open, onClose, onSelectFriend }: NewChatDialogProps) => {
  const { user } = useAuth();
  const { followers, following, loading } = useFollowers(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);

  // Get mutual followers only (people who follow you AND you follow them)
  const mutualFollowers = useMemo(() => {
    if (!user) return [];
    
    const followerIds = new Set(followers.map(f => f.follower_id));
    
    // Get people we follow who also follow us back
    return following
      .filter(f => f.following && followerIds.has(f.following_id))
      .map(f => f.following!)
      .filter(Boolean);
  }, [followers, following, user]);

  const filteredFriends = mutualFollowers.filter(friend =>
    !searchQuery.trim() ||
    friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mutual friends..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Info banner */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span>You can only message people who follow you back</span>
          </div>

          <ScrollArea className="h-[350px] pr-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 p-3 rounded animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium mb-2">No mutual friends found</p>
                <p className="text-sm">
                  {searchQuery 
                    ? 'Try a different search term' 
                    : 'Follow people who follow you back to message them'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFriends.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
                    onClick={async () => {
                      if (creating) return;
                      setCreating(true);
                      try {
                        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (!uuidRegex.test(friend.id)) {
                          console.error('[NewChatDialog] Invalid UUID:', friend.id);
                          throw new Error('Invalid user ID format');
                        }
                        
                        await onSelectFriend(friend.id);
                        setSearchQuery('');
                        onClose();
                      } catch (error) {
                        console.error('[NewChatDialog] Error:', error);
                      } finally {
                        setCreating(false);
                      }
                    }}
                  >
                    <Avatar>
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback>{friend.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-medium truncate">{friend.display_name}</p>
                        <VerificationBadge
                          isVerified={friend.is_verified}
                          verificationType={friend.verification_type}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
