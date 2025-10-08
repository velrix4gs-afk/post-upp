import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import CreatePost from '@/components/CreatePost';
import { PostCard } from '@/components/PostCard';
import Stories from '@/components/Stories';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Users, Hash, UserCheck, Compass } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const navigate = useNavigate();
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
          {/* Left Sidebar - Quick Actions */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Compass className="h-5 w-5" />
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => navigate('/explore')}
                >
                  <Compass className="h-4 w-4 mr-2" />
                  Explore
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => navigate('/friends')}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => navigate('/groups')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Browse Groups
                </Button>
              </div>
            </Card>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-6 space-y-6">
            {/* Stories */}
            <Stories />

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
                    post={{
                      id: post.id,
                      content: post.content || '',
                      media_url: post.media_url,
                      created_at: post.created_at,
                      reactions_count: post.reactions_count,
                      comments_count: post.comments_count,
                      author_name: post.profiles.display_name,
                      author_avatar: post.profiles.avatar_url,
                      author_id: post.user_id
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Info */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Welcome!</h3>
              <p className="text-sm text-muted-foreground">
                Connect with friends, share moments, and discover new content from real users.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;