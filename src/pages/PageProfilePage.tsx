import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePages, Page } from '@/hooks/usePages';
import { useAuth } from '@/hooks/useAuth';
import { BackNavigation } from '@/components/BackNavigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Users, Settings, Send, ImageIcon, CheckCircle } from 'lucide-react';
import { PostCardModern } from '@/components/PostCard/PostCardModern';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PageProfilePage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPageByUsername, followPage, unfollowPage, getPagePosts, createPagePost } = usePages();

  const [page, setPage] = useState<Page | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  const isOwnerOrAdmin = page?.user_role === 'owner' || page?.user_role === 'admin' || page?.user_role === 'editor';

  useEffect(() => {
    if (username) loadPage();
  }, [username]);

  const loadPage = async () => {
    if (!username) return;
    setLoading(true);
    const pageData = await getPageByUsername(username);
    if (!pageData) {
      toast({ title: 'Page not found' });
      navigate('/pages');
      return;
    }
    setPage(pageData);
    const pagePosts = await getPagePosts(pageData.id);
    setPosts(pagePosts);
    setLoading(false);
  };

  const handleFollowToggle = async () => {
    if (!page) return;
    if (page.is_following) {
      await unfollowPage(page.id);
      setPage(prev => prev ? { ...prev, is_following: false, followers_count: prev.followers_count - 1 } : null);
    } else {
      await followPage(page.id);
      setPage(prev => prev ? { ...prev, is_following: true, followers_count: prev.followers_count + 1 } : null);
    }
  };

  const handleCreatePost = async () => {
    if (!page || !newPostContent.trim()) return;
    setPosting(true);
    try {
      await createPagePost(page.id, { content: newPostContent });
      setNewPostContent('');
      const pagePosts = await getPagePosts(page.id);
      setPosts(pagePosts);
    } catch {
      // Error handled in hook
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <BackNavigation />
        </div>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <BackNavigation />
          <h1 className="text-lg font-bold truncate">{page.name}</h1>
          {isOwnerOrAdmin && (
            <Button size="sm" variant="ghost" onClick={() => navigate(`/page/${page.id}/edit`)}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Cover */}
        <div className="h-48 bg-muted relative">
          {page.cover_url && (
            <img src={page.cover_url} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Page Info */}
        <div className="px-4 -mt-12 relative z-[1]">
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={page.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {page.name[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{page.name}</h2>
              {page.is_verified && <CheckCircle className="h-5 w-5 text-primary" />}
            </div>
            <p className="text-muted-foreground text-sm">@{page.username}</p>
            {page.category && <Badge variant="secondary">{page.category}</Badge>}
            {page.description && (
              <p className="text-foreground text-sm">{page.description}</p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="font-semibold text-foreground">{page.followers_count}</span> followers
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {user && page.created_by !== user.id && (
                <Button
                  onClick={handleFollowToggle}
                  variant={page.is_following ? 'outline' : 'default'}
                  className="rounded-full"
                >
                  {page.is_following ? 'Following' : 'Follow'}
                </Button>
              )}
              {isOwnerOrAdmin && (
                <Button variant="outline" className="rounded-full" onClick={() => navigate(`/page/${page.id}/edit`)}>
                  Manage Page
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Create Post (for page admins) */}
        {isOwnerOrAdmin && (
          <div className="px-4 mt-6">
            <Card className="p-4">
              <Textarea
                placeholder={`Post as ${page.name}...`}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[80px] resize-none border-0 focus-visible:ring-0 p-0"
              />
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
                <Button
                  size="sm"
                  disabled={!newPostContent.trim() || posting}
                  onClick={handleCreatePost}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {posting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Posts Feed */}
        <div className="mt-6 space-y-4 px-4">
          <h3 className="font-semibold text-lg">Posts</h3>
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No posts yet</p>
            </Card>
          ) : (
            posts.map((post: any) => (
              <PostCardModern
                key={post.id}
                post={{
                  id: post.id,
                  content: post.content || '',
                  media_url: post.media_url,
                  created_at: post.created_at,
                  reactions_count: post.reactions_count || 0,
                  comments_count: post.comments_count || 0,
                  shares_count: post.shares_count || 0,
                  author_name: page.name,
                  author_username: page.username,
                  author_avatar: page.avatar_url,
                  author_id: post.user_id,
                  is_verified: page.is_verified,
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PageProfilePage;
