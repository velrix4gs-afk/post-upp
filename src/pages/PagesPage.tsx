import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { BackNavigation } from '@/components/BackNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Users, FileText, Briefcase, Heart, Music, Dumbbell, BookOpen, Upload, X } from 'lucide-react';
import { useCreatorPages } from '@/hooks/useCreatorPages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const PAGE_CATEGORIES = [
  { id: 'business', name: 'Business', icon: Briefcase },
  { id: 'community', name: 'Community', icon: Users },
  { id: 'entertainment', name: 'Entertainment', icon: Heart },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell },
  { id: 'education', name: 'Education', icon: BookOpen },
  { id: 'other', name: 'Other', icon: FileText },
];

const PagesPage = () => {
  const { user } = useAuth();
  const { pages, loading, createPage, updatePage, deletePage, checkSlugAvailability, refetch } = useCreatorPages();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    bio: '',
    contact_info: {} as any,
    website_url: '',
    location: ''
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleCreatePage = async () => {
    if (!formData.title || !formData.slug) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const isAvailable = await checkSlugAvailability(formData.slug);
    if (!isAvailable) {
      toast({
        title: 'Error',
        description: 'This page URL is already taken',
        variant: 'destructive'
      });
      return;
    }

    try {
      let avatarUrl = '';
      let coverUrl = '';

      if (avatarFile) {
        avatarUrl = await uploadImage(
          avatarFile,
          'avatars',
          `pages/${user?.id}/${formData.slug}-avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`
        );
      }

      if (coverFile) {
        coverUrl = await uploadImage(
          coverFile,
          'covers',
          `pages/${user?.id}/${formData.slug}-cover-${Date.now()}.${coverFile.name.split('.').pop()}`
        );
      }

      await createPage({
        ...formData,
        profile_url: avatarUrl,
        cover_url: coverUrl,
        is_published: true
      });

      setCreateDialogOpen(false);
      setFormData({
        title: '',
        slug: '',
        category: '',
        bio: '',
        contact_info: {},
        website_url: '',
        location: ''
      });
      setAvatarFile(null);
      setAvatarPreview('');
      setCoverFile(null);
      setCoverPreview('');
      refetch();
    } catch (error: any) {
      console.error('Error creating page:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create page',
        variant: 'destructive'
      });
    }
  };

  const myPages = pages.filter(page => page.user_id === user?.id);
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <BackNavigation title="Pages" />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Pages</h1>
            <p className="text-muted-foreground">Discover and create pages</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>

        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="my-pages">My Pages</TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <TabsContent value="discover" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPages.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pages found</h3>
                <p className="text-muted-foreground">Be the first to create a page!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPages.map(page => (
                  <Card key={page.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={page.profile_url || ''} />
                        <AvatarFallback>{page.title[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{page.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">@{page.slug}</p>
                        {page.bio && (
                          <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{page.bio}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm">Follow</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="following">
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
              <p className="text-muted-foreground">Follow pages to see them here</p>
            </Card>
          </TabsContent>

          <TabsContent value="my-pages" className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-20 w-full" />
                  </Card>
                ))}
              </div>
            ) : myPages.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
                <p className="text-muted-foreground mb-4">Create your first page to get started</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Page
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {myPages.map(page => (
                  <Card key={page.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={page.profile_url || ''} />
                        <AvatarFallback>{page.title[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{page.title}</h3>
                        <p className="text-sm text-muted-foreground">@{page.slug}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Page Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Page</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cover Image */}
            <div>
              <Label>Cover Image</Label>
              <div className="mt-2 relative h-32 bg-muted rounded-lg overflow-hidden">
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <label className="flex items-center justify-center h-full cursor-pointer hover:bg-muted/80">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Avatar */}
            <div>
              <Label>Page Avatar</Label>
              <div className="mt-2 flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} />
                  ) : (
                    <AvatarFallback>
                      <Upload className="h-8 w-8" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex gap-2">
                  <label>
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                  {avatarPreview && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview('');
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Page Name *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (!formData.slug) {
                    setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) });
                  }
                }}
                placeholder="Enter page name"
              />
            </div>

            <div>
              <Label htmlFor="slug">Page URL *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">post-upp.com/page/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  placeholder="page-url"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select a category</option>
                {PAGE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell people about your page"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePage}>
                Create Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesPage;
