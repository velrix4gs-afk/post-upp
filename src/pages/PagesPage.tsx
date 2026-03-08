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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Search, Users, FileText, Briefcase, Heart, Music, Dumbbell, BookOpen, Upload, X, CheckCircle } from 'lucide-react';
import { usePages } from '@/hooks/usePages';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

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
  const { pages, myPages, loading, createPage, followPage, unfollowPage, refetch } = usePages();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    category: '',
    description: '',
  });

  const generateUsername = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePage = async () => {
    if (!formData.name || !formData.username) {
      toast({ title: 'Error', description: 'Name and username are required', variant: 'destructive' });
      return;
    }
    try {
      await createPage({
        name: formData.name,
        username: formData.username,
        description: formData.description,
        category: formData.category,
        avatar: avatarFile || undefined,
      });
      setCreateDialogOpen(false);
      setFormData({ name: '', username: '', category: '', description: '' });
      setAvatarFile(null);
      setAvatarPreview('');
    } catch {
      // handled in hook
    }
  };

  const followingPages = pages.filter(p => p.is_following);
  const filteredPages = pages.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CreateForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Page Avatar</Label>
        <div className="mt-2 flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {avatarPreview ? <AvatarImage src={avatarPreview} /> : <AvatarFallback><Upload className="h-8 w-8" /></AvatarFallback>}
          </Avatar>
          <label>
            <Button variant="outline" size="sm" asChild><span><Upload className="h-4 w-4 mr-2" />Upload</span></Button>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          {avatarPreview && (
            <Button variant="outline" size="sm" onClick={() => { setAvatarFile(null); setAvatarPreview(''); }}>Remove</Button>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="name">Page Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => {
            const name = e.target.value;
            setFormData(prev => ({
              ...prev,
              name,
              username: prev.username || generateUsername(name),
            }));
          }}
          placeholder="Enter page name"
        />
      </div>
      <div>
        <Label htmlFor="username">Username *</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/page/</span>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: generateUsername(e.target.value) })}
            placeholder="page-username"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        <Label htmlFor="description">Bio</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Tell people about your page"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleCreatePage}>Create Page</Button>
      </div>
    </div>
  );

  const PageCard = ({ page, showFollowBtn = true }: { page: typeof pages[0]; showFollowBtn?: boolean }) => (
    <Card
      key={page.id}
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/page/${page.username}`)}
    >
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={page.avatar_url || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground">{page.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold truncate">{page.name}</h3>
            {page.is_verified && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground">@{page.username}</p>
          {page.category && <Badge variant="secondary" className="mt-1 text-xs">{page.category}</Badge>}
          <p className="text-xs text-muted-foreground mt-1">{page.followers_count} followers</p>
        </div>
        {showFollowBtn && user && page.created_by !== user.id && !page.user_role && (
          <Button
            variant={page.is_following ? 'outline' : 'default'}
            size="sm"
            className="rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              page.is_following ? unfollowPage(page.id) : followPage(page.id);
            }}
          >
            {page.is_following ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
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
            <Input placeholder="Search pages..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <TabsContent value="discover" className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => <Card key={i} className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /></div></div></Card>)
            ) : filteredPages.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pages found</h3>
                <p className="text-muted-foreground">Be the first to create a page!</p>
              </Card>
            ) : (
              filteredPages.map(page => <PageCard key={page.id} page={page} />)
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-3">
            {followingPages.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
                <p className="text-muted-foreground">Follow pages to see them here</p>
              </Card>
            ) : (
              followingPages.map(page => <PageCard key={page.id} page={page} />)
            )}
          </TabsContent>

          <TabsContent value="my-pages" className="space-y-3">
            {loading ? (
              [1, 2].map(i => <Card key={i} className="p-4"><Skeleton className="h-20 w-full" /></Card>)
            ) : myPages.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
                <p className="text-muted-foreground mb-4">Create your first page</p>
                <Button onClick={() => setCreateDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Page</Button>
              </Card>
            ) : (
              myPages.map(page => (
                <Card key={page.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/page/${page.username}`)}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={page.avatar_url || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">{page.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{page.name}</h3>
                      <p className="text-sm text-muted-foreground">@{page.username}</p>
                      <Badge variant="outline" className="mt-1 text-xs">{page.user_role}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/page/${page.id}/edit`); }}>Edit</Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {isMobile ? (
        <Drawer open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DrawerContent className="max-h-[95vh]">
            <DrawerHeader><DrawerTitle>Create a New Page</DrawerTitle></DrawerHeader>
            <ScrollArea className="px-4 pb-8"><CreateForm /></ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create a New Page</DialogTitle></DialogHeader>
            <CreateForm />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PagesPage;
