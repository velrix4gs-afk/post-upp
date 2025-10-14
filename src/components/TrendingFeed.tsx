import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from './PostCard';
import { Skeleton } from './ui/skeleton';
import { TrendingUp } from 'lucide-react';

const TrendingFeed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrending = async () => {
    try {
      setLoading(true);
      
      // Fetch trending posts - view already sorts by trending_score DESC
      const { data, error } = await supabase
        .from('trending_posts')
        .select(`
          id,
          user_id,
          content,
          media_url,
          media_type,
          privacy,
          reactions_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          profiles:user_id (
            display_name,
            username,
            avatar_url,
            is_verified
          )
        `)
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching trending posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();

    // Refresh every 5 minutes
    const interval = setInterval(fetchTrending, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Trending Posts</h3>
        <p className="text-muted-foreground">
          Check back later for trending content
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Trending Now</h2>
      </div>
      
      {posts.map((post) => (
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
    </div>
  );
};

export default TrendingFeed;
