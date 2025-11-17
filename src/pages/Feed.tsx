import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { useNavigate } from 'react-router-dom';
import { RealtimeFeed } from '@/components/RealtimeFeed';
import Navigation from '@/components/Navigation';
import CreatePost from '@/components/CreatePost';
import { PostCard } from '@/components/PostCard';
import Stories from '@/components/Stories';
import TrendingFeed from '@/components/TrendingFeed';
import { Sparkles, Users, TrendingUp, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/PullToRefresh';

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'trending'>('for-you');
  const { posts, loading, hasMore, loadMore, refresh } = useFeed(activeTab === 'trending' ? 'for-you' : activeTab);
  const { ref: loadMoreRef, inView } = useInView();
  
  const { containerRef, isPulling, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      await refresh();
    },
  });

  // Handle real-time post updates - only when user creates a post
  const handleNewPost = () => {
    // Don't auto-refresh, let user manually refresh
  };

  // Infinite scroll
  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadMore();
    }
  }, [inView, loading, hasMore, loadMore]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <RealtimeFeed onNewPost={handleNewPost} />
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
      />
      <Navigation />
      
        <div className="container mx-auto flex gap-6 px-0 lg:px-8 -mt-2">
        {/* Main Feed - Left/Center */}
        <main className="flex-1 max-w-2xl mx-auto lg:mx-0 lg:border-x min-h-screen pb-20 border-x-0 md:border-x">
        {/* Sticky Tab Navigation */}
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30 border-b">
          <div className="flex items-center">
            <div className="flex-1 flex">
              <button
                onClick={() => setActiveTab('for-you')}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors relative",
                  activeTab === 'for-you' && "font-bold"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>For You</span>
                </div>
                {activeTab === 'for-you' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('following')}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors relative",
                  activeTab === 'following' && "font-bold"
                )}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Following</span>
                </div>
                {activeTab === 'following' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('trending')}
                className={cn(
                  "flex-1 px-4 py-2.5 text-sm font-semibold hover:bg-muted/50 transition-colors relative",
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
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/search')}
              className="mr-2"
            >
              <Search className="h-5 w-5" />
            </Button>
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
          <div className="feed-container">
            {posts.map(post => (
              <div key={post.id} className="feed-post-item border-b last:border-b-0">
                <PostCard
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
              </div>
            ))}
            
            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="h-40 flex items-center justify-center">
                {loading && <Skeleton className="h-10 w-10 rounded-full" />}
              </div>
            )}
          </div>
        )}
        </main>

        {/* Right Sidebar - Desktop Only */}
        <aside className="hidden lg:block w-80 sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
          <TrendingFeed />
        </aside>
      </div>
    </div>
  );
};

export default Feed;