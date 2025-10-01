import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Hash, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Feed = () => {
  const { user } = useAuth();
  const { posts, loading, createPost, toggleReaction } = usePosts();
  const [activeTab, setActiveTab] = useState<'friends' | 'trending' | 'all'>('all');

  useEffect(() => {
    if (user) {
      // Set up real-time subscription for new posts from authenticated users only
      const channel = supabase
        .channel('feed-posts')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts'
          },
          () => {
            // Refetch to get updated posts with profile info
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Trending */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                  <Hash className="h-4 w-4" />
                  <div>
                    <p className="font-medium text-sm">#Technology</p>
                    <p className="text-xs text-muted-foreground">1.2K posts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                  <Hash className="h-4 w-4" />
                  <div>
                    <p className="font-medium text-sm">#Sports</p>
                    <p className="text-xs text-muted-foreground">856 posts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                  <Hash className="h-4 w-4" />
                  <div>
                    <p className="font-medium text-sm">#Music</p>
                    <p className="text-xs text-muted-foreground">623 posts</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Suggested Users
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10" />
                    <div>
                      <p className="font-medium text-sm">User Name</p>
                      <p className="text-xs text-muted-foreground">@username</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Follow</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-6">
            <CreatePost />

            <Card className="p-2">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'all' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setActiveTab('all')}
                >
                  All Posts
                </Button>
                <Button
                  variant={activeTab === 'friends' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setActiveTab('friends')}
                >
                  Friends
                </Button>
                <Button
                  variant={activeTab === 'trending' ? 'default' : 'ghost'}
                  className="flex-1"
                  onClick={() => setActiveTab('trending')}
                >
                  Trending
                </Button>
              </div>
            </Card>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <div className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <UserCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No posts yet from real users</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to share something! Only authenticated real users can post here.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start by creating a post, following friends, or joining groups.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    id={post.id}
                    author={{
                      name: post.profiles.display_name,
                      username: post.profiles.username,
                      avatar: post.profiles.avatar_url,
                      verified: post.profiles.is_verified
                    }}
                    content={post.content || ''}
                    image={post.media_urls?.[0]}
                    timestamp={new Date(post.created_at).toLocaleDateString()}
                    likes={post.likes_count}
                    comments={post.comments_count}
                    shares={post.shares_count}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Online Friends */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Online Friends</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-primary/10" />
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Friend Name</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;