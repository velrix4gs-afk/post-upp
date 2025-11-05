import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import CreatePost from '@/components/CreatePost';
import { PostCard } from '@/components/PostCard';
import Stories from '@/components/Stories';
import TrendingFeed from '@/components/TrendingFeed';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';

const Feed = () => {
  const { user } = useAuth();
  const { posts, loading } = usePosts();
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'trending'>('all');
  const { ref: loadMoreRef, inView } = useInView();
  const [page, setPage] = useState(1);

  // Real-time subscription for posts
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('feed-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Post change:', payload);
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Infinite scroll
  useEffect(() => {
    if (inView && !loading) {
      setPage(prev => prev + 1);
    }
  }, [inView, loading]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-2xl mx-auto border-x min-h-screen">
        {/* Sticky Tab Navigation */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "flex-1 px-4 py-4 text-sm font-semibold hover:bg-muted/50 transition-colors relative",
                activeTab === 'all' && "font-bold"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>For You</span>
              </div>
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('friends')}
              className={cn(
                "flex-1 px-4 py-4 text-sm font-semibold hover:bg-muted/50 transition-colors relative",
                activeTab === 'friends' && "font-bold"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>Following</span>
              </div>
              {activeTab === 'friends' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('trending')}
              className={cn(
                "flex-1 px-4 py-4 text-sm font-semibold hover:bg-muted/50 transition-colors relative",
                activeTab === 'trending' && "font-bold"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Trending</span>
              </div>
              {activeTab === 'trending' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>

        {/* Stories */}
        <div className="border-b">
          <Stories />
        </div>

        {/* Create Post */}
        <div className="border-b">
          <CreatePost />
        </div>

        {/* Feed Content */}
        {activeTab === 'trending' ? (
          <TrendingFeed />
        ) : loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 border-b">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share something!
              </p>
            </div>
          </div>
        ) : (
          <div>
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
                  shares_count: post.shares_count || 0,
                  author_name: post.profiles?.display_name || 'Unknown User',
                  author_avatar: post.profiles?.avatar_url,
                  author_id: post.user_id
                }}
              />
            ))}
            
            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {loading && <Skeleton className="h-10 w-10 rounded-full" />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;