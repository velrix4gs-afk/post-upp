import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { BackNavigation } from '@/components/BackNavigation';
import { PostCard } from '@/components/PostCard';
import ProfileEdit from '@/components/ProfileEdit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { CoinsDisplay } from '@/components/CoinsDisplay';
import { FollowersDialog } from '@/components/FollowersDialog';
import { VerificationBadge } from '@/components/premium/VerificationBadge';
import { StoryHighlights } from '@/components/StoryHighlights';
import { usePinnedPosts } from '@/hooks/usePinnedPosts';
import { useUserReplies } from '@/hooks/useUserReplies';
import { useUserLikes } from '@/hooks/useUserLikes';
import { 
  Edit, 
  MapPin, 
  Calendar, 
  Link as LinkIcon,
  Heart,
  Cake,
  Camera,
  Settings,
  UserPlus,
  UserCheck,
  MessageCircle,
  Pin,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/usePosts';
import { useFriends } from '@/hooks/useFriends';
import { useFollowers } from '@/hooks/useFollowers';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import CreatePost from '@/components/CreatePost';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // If no userId in params, show current user's profile
  const profileUserId = userId || user?.id;
  const isOwnProfile = profileUserId === user?.id;
  
  const { profile, loading: profileLoading, refetch: refetchProfile } = useProfile(profileUserId);
  const { posts, loading: postsLoading } = usePosts();
  const { friends } = useFriends();
  const { followers, following, followUser, unfollowUser } = useFollowers(profileUserId);
  const { pinnedPostIds } = usePinnedPosts(profileUserId);
  const { replies: userReplies, loading: repliesLoading } = useUserReplies(profileUserId);
  const { likedPosts, loading: likesLoading } = useUserLikes(profileUserId);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);

  const handleProfileEditClose = () => {
    setShowProfileEdit(false);
    // Refetch profile to get updated data
    refetchProfile();
  };

  const userPosts = posts.filter(post => post.user_id === profileUserId);
  const pinnedPosts = userPosts.filter(post => pinnedPostIds.includes(post.id));
  const regularPosts = userPosts.filter(post => !pinnedPostIds.includes(post.id));
  
  // Check if current user is following this profile
  const isFollowing = following.some(f => f.following_id === profileUserId);
  
  const handleFollowToggle = async () => {
    if (!profileUserId) return;
    
    if (isFollowing) {
      await unfollowUser(profileUserId);
    } else {
      await followUser(profileUserId, profile?.is_private || false);
    }
  };
  
  const handleMessage = async () => {
    if (!profileUserId || !user) return;
    
    try {
      // Use RPC to find or create chat
      const { data: chatId, error: rpcError } = await supabase.rpc('create_private_chat', {
        _user1: user.id,
        _user2: profileUserId
      });

      if (rpcError) throw rpcError;
      
      navigate(`/messages?chat=${chatId}`);
    } catch (error: any) {
      console.error('Message error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start conversation',
        variant: 'destructive'
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Skeleton className="h-48 md:h-64 w-full rounded-lg mb-6" />
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
            <p className="text-muted-foreground">This user doesn't exist or has been removed.</p>
          </Card>
        </div>
      </div>
    );
  }

  const formatJoinDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM yyyy');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <BackNavigation title={profile?.display_name} />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Cover Photo */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary to-primary-foreground rounded-lg overflow-hidden mb-6">
          {profile?.cover_url ? (
            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
              <Camera className="h-12 w-12 text-primary opacity-50" />
            </div>
          )}
          {isOwnProfile ? (
            <Button
              size="sm"
              className="absolute bottom-4 right-4"
              onClick={() => setShowProfileEdit(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                size="sm"
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
              <Button size="sm" variant="outline" onClick={handleMessage}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
            {/* Avatar */}
            <div className="relative -mt-16 md:-mt-20 mb-4 md:mb-0">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-background shadow-elegant">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={`${profile.display_name}'s profile picture`} />
                ) : (
                  <AvatarFallback className="bg-gradient-primary text-white text-4xl">
                    {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              {profile?.is_verified && (
                <div className="absolute -bottom-2 -right-2">
                  <VerificationBadge 
                    isVerified={profile.is_verified}
                    verificationType={profile.verification_type}
                  />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    {profile?.display_name}
                  </h1>
                  <p className="text-lg text-muted-foreground">@{profile?.username}</p>
                  
                  {/* Bio */}
                  {profile?.bio && (
                    <p className="mt-3 text-muted-foreground">{profile.bio}</p>
                  )}
                </div>
                
                {/* Stats Bar - Moved next to name */}
                <div className="flex md:flex-col gap-4 md:gap-2 md:items-end">
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">{userPosts.length}</div>
                      <div className="text-xs text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setShowFollowersDialog(true)}>
                      <div className="text-xl md:text-2xl font-bold">{followers.length}</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setShowFollowingDialog(true)}>
                      <div className="text-xl md:text-2xl font-bold">{following.length}</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                {isOwnProfile && (
                  <div className="flex items-center">
                    <CoinsDisplay />
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center">
                    <LinkIcon className="h-4 w-4 mr-1" />
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {profile.website.replace('https://', '')}
                    </a>
                  </div>
                )}
                {profile?.birth_date && (
                  <div className="flex items-center">
                    <Cake className="h-4 w-4 mr-1" />
                    Born {format(new Date(profile.birth_date), 'MMMM d, yyyy')}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {formatJoinDate(profile?.created_at || '')}
                </div>
              </div>

              {/* Relationship Status */}
              {profile?.relationship_status && (
                <div className="flex items-center mt-2 text-sm">
                  <Heart className="h-4 w-4 mr-1 text-destructive" />
                  <span className="capitalize">{profile.relationship_status.replace('_', ' ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Story Highlights */}
        <StoryHighlights userId={profileUserId!} isOwnProfile={isOwnProfile} />

        <Separator className="my-6" />

        {/* Tabs Section */}
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
            <TabsTrigger 
              value="posts" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Posts
            </TabsTrigger>
            <TabsTrigger 
              value="replies" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Replies
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Media
            </TabsTrigger>
            <TabsTrigger 
              value="likes" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Likes
            </TabsTrigger>
          </TabsList>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-6 mt-6">
            {isOwnProfile && <CreatePost />}

            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Pinned Posts
                </h3>
                {pinnedPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={{
                      id: post.id,
                      content: post.content || '',
                      media_url: post.media_url,
                      created_at: post.created_at,
                      reactions_count: post.reactions_count,
                      comments_count: post.comments_count,
                      author_name: profile?.display_name || '',
                      author_avatar: profile?.avatar_url,
                      author_id: post.user_id
                    }}
                  />
                ))}
                <Separator />
              </div>
            )}

            {userPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? 'Share your first post to get started!' : 'This user hasn\'t posted anything yet.'}
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {regularPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={{
                      id: post.id,
                      content: post.content || '',
                      media_url: post.media_url,
                      created_at: post.created_at,
                      reactions_count: post.reactions_count,
                      comments_count: post.comments_count,
                      author_name: profile?.display_name || '',
                      author_avatar: profile?.avatar_url,
                      author_id: post.user_id
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Replies Tab */}
          <TabsContent value="replies" className="space-y-4 mt-6">
            {repliesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </Card>
                ))}
              </div>
            ) : userReplies.length === 0 ? (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No replies yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "When you reply to posts, they'll appear here." : "This user hasn't replied to any posts yet."}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {userReplies.map((reply) => (
                  <Card key={reply.id} className="p-4 hover:bg-muted/30 transition-colors">
                    {/* Original post reference */}
                    {reply.post && (
                      <div 
                        className="text-xs text-muted-foreground mb-2 flex items-center gap-1 cursor-pointer hover:text-foreground"
                        onClick={() => navigate(`/post/${reply.post_id}`)}
                      >
                        <span>Replying to</span>
                        <span className="font-medium">@{reply.post.profiles?.username || 'user'}</span>
                      </div>
                    )}
                    {/* Reply content */}
                    <p className="text-sm">{reply.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6 mt-6">
            <div className="grid grid-cols-3 gap-2">
              {userPosts
                .filter(post => post.media_url)
                .map((post) => (
                  <div 
                    key={post.id} 
                    className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img 
                      src={post.media_url} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
            </div>
            {!userPosts.some(p => p.media_url) && (
              <Card className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No media yet</h3>
                <p className="text-muted-foreground">
                  Photos and videos will appear here
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Likes Tab */}
          <TabsContent value="likes" className="space-y-6 mt-6">
            {likesLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </Card>
                ))}
              </div>
            ) : likedPosts.length === 0 ? (
              <Card className="p-8 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No liked posts</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile ? "Posts you like will appear here." : "This user hasn't liked any posts yet."}
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {likedPosts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={{
                      id: post.id,
                      content: post.content || '',
                      media_url: post.media_url,
                      created_at: post.created_at,
                      reactions_count: post.reactions_count,
                      comments_count: post.comments_count,
                      author_name: post.profiles?.display_name || 'Unknown',
                      author_avatar: post.profiles?.avatar_url,
                      author_id: post.user_id
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <ProfileEdit onClose={handleProfileEditClose} />
      )}
      
      {/* Followers/Following Dialogs */}
      <FollowersDialog
        open={showFollowersDialog}
        onClose={() => setShowFollowersDialog(false)}
        users={followers.map(f => f.follower)}
        title="Followers"
      />
      
      <FollowersDialog
        open={showFollowingDialog}
        onClose={() => setShowFollowingDialog(false)}
        users={following.map(f => f.following)}
        title="Following"
      />
    </div>
  );
};

export default ProfilePage;