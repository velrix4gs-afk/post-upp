import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import PostCard from '@/components/PostCard';
import ProfileEdit from '@/components/ProfileEdit';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePosts } from '@/hooks/usePosts';
import { useFriends } from '@/hooks/useFriends';
import { useFollowers } from '@/hooks/useFollowers';
import { formatDistanceToNow, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // If no userId in params, show current user's profile
  const profileUserId = userId || user?.id;
  const isOwnProfile = profileUserId === user?.id;
  
  const { profile, loading: profileLoading } = useProfile(profileUserId);
  const { posts, loading: postsLoading } = usePosts();
  const { friends } = useFriends();
  const { followers, following, followUser, unfollowUser } = useFollowers(profileUserId);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  const userPosts = posts.filter(post => post.user_id === profileUserId);
  
  // Check if current user is following this profile
  const isFollowing = following.some(f => f.following_id === profileUserId && f.status === 'accepted');
  
  const handleFollowToggle = async () => {
    if (!profileUserId) return;
    
    if (isFollowing) {
      await unfollowUser(profileUserId);
    } else {
      await followUser(profileUserId, profile?.is_private || false);
    }
  };
  
  const handleMessage = async () => {
    if (!profileUserId) return;
    
    // Create or get existing chat
    const { data: existingChats } = await supabase
      .from('chat_participants')
      .select('chat_id, chats:chat_id(type)')
      .eq('user_id', user?.id);

    if (existingChats) {
      for (const ec of existingChats) {
        if (ec.chats?.type === 'private') {
          const { data: otherParticipant } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('chat_id', ec.chat_id)
            .neq('user_id', user?.id)
            .single();

          if (otherParticipant?.user_id === profileUserId) {
            navigate(`/messages?chat=${ec.chat_id}`);
            return;
          }
        }
      }
    }

    // Create new chat
    const { data: chat } = await supabase
      .from('chats')
      .insert({ type: 'private' })
      .select()
      .single();

    if (chat) {
      await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chat.id, user_id: user?.id, role: 'member' },
          { chat_id: chat.id, user_id: profileUserId, role: 'member' }
        ]);

      navigate(`/messages?chat=${chat.id}`);
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
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
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
              <Avatar className="h-32 w-32 md:h-40 md:w-40 ring-4 ring-background">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-white text-4xl">
                  {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              {profile?.is_verified && (
                <Badge className="absolute -bottom-2 -right-2 bg-primary">
                  ✓ Verified
                </Badge>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{profile?.display_name}</h1>
                  <p className="text-lg text-muted-foreground">@{profile?.username}</p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{userPosts.length}</div>
                    <div className="text-sm text-muted-foreground">Posts</div>
                  </div>
                  <div className="text-center cursor-pointer hover:opacity-80">
                    <div className="text-2xl font-bold">{followers.length}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center cursor-pointer hover:opacity-80">
                    <div className="text-2xl font-bold">{following.length}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="mt-4 text-muted-foreground">{profile.bio}</p>
              )}

              {/* Details */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
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

        <Separator className="my-6" />

        {/* Posts Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Posts</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Privacy
              </Button>
            </div>
          </div>

          {userPosts.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Share your first post to get started!
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  id={post.id}
                  author={{
                    name: profile?.display_name || '',
                    username: profile?.username || '',
                    avatar: profile?.avatar_url,
                    verified: profile?.is_verified
                  }}
                  content={post.content || ''}
                  image={post.media_url}
                  timestamp={formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  likes={post.reactions_count}
                  comments={post.comments_count}
                  shares={0}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <ProfileEdit onClose={() => setShowProfileEdit(false)} />
      )}
    </div>
  );
};

export default ProfilePage;