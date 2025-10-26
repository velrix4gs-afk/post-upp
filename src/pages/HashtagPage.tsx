import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHashtags } from '@/hooks/useHashtags';
import { PostCard } from '@/components/PostCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Hash } from 'lucide-react';

const HashtagPage = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const { getPostsByHashtag, loading } = useHashtags();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (tag) {
      loadPosts();
    }
  }, [tag]);

  const loadPosts = async () => {
    if (!tag) return;
    const data = await getPostsByHashtag(tag);
    setPosts(data);
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <main className="container max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          <Hash className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">#{tag}</h1>
            <p className="text-muted-foreground">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'}
            </p>
          </div>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground">
            Be the first to post with #{tag}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
};

export default HashtagPage;
