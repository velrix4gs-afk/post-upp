import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import CreatePost from '@/components/CreatePost';
import { PostCard } from '@/components/PostCard';
import Stories from '@/components/Stories';
import TrendingFeed from '@/components/TrendingFeed';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      {/* Twitter/X Style Layout */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-30">
        <div className="max-w-2xl mx-auto">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "flex-1 px-4 py-4 text-sm font-semibold hover:bg-muted/50 transition-colors relative",
                activeTab === 'all' && "font-bold"
              )}
            >
              For You
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
              Following
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
              Trending
              {activeTab === 'trending' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto">
        {/* Create Post */}
        <div className="border-b">
          <CreatePost />
        </div>

        {/* Feed Posts */}
        {activeTab === 'trending' ? (
          <TrendingFeed />
        ) : loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} className="border-b p-4">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="border-b p-12 text-center">
            <div className="max-w-md mx-auto">
              <UserCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to share something!
              </p>
            </div>
          </div>
        ) : (
          <div>
            {posts.map(post => (
              <div key={post.id} className="border-b hover:bg-muted/30 transition-colors">
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
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;