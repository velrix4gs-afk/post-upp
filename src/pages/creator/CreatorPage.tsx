import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCreatorPages } from '@/hooks/useCreatorPages';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react';

export const CreatorPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { fetchPageBySlug } = useCreatorPages();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      if (!slug) return;
      const data = await fetchPageBySlug(slug);
      setPage(data);
      setLoading(false);
    };
    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
            <p className="text-muted-foreground">This creator page doesn't exist or has been unpublished</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        {/* Cover Image */}
        {page.cover_url && (
          <div className="h-48 md:h-64 w-full bg-muted">
            <img 
              src={page.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Profile Section */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="-mt-16 md:-mt-20 mb-4">
            <Avatar className="h-32 w-32 border-4 border-background">
              <AvatarImage src={page.profile_url || undefined} />
              <AvatarFallback>{page.title.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{page.title}</h1>
                <Badge variant="default" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Verified
                </Badge>
              </div>
              <p className="text-muted-foreground">@{page.slug}</p>
            </div>
            <div className="flex gap-2">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Follow
              </Button>
              {page.monetization_enabled && (
                <Button variant="outline">
                  Support
                </Button>
              )}
            </div>
          </div>

          {page.bio && (
            <p className="text-lg mb-6">{page.bio}</p>
          )}

          {/* Content Sections */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Posts</h2>
              <p className="text-muted-foreground">No posts yet</p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">About</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Creator page for {page.title}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
