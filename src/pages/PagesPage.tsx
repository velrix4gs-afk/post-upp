import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { BackNavigation } from '@/components/BackNavigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  CheckCircle, 
  Users, 
  TrendingUp,
  Store,
  Palette,
  Music,
  User,
  Tv,
  Coffee,
  ShoppingBag,
  Heart,
  GraduationCap,
  HandHeart,
  Building,
  Trophy,
  Newspaper,
  Smartphone,
  MoreHorizontal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const PAGE_CATEGORIES = [
  { id: '1', name: 'Local Business', icon: Store },
  { id: '2', name: 'Brand/Product', icon: ShoppingBag },
  { id: '3', name: 'Artist/Band', icon: Music },
  { id: '4', name: 'Public Figure', icon: User },
  { id: '5', name: 'Entertainment', icon: Tv },
  { id: '6', name: 'Restaurant/Café', icon: Coffee },
  { id: '7', name: 'Shopping/Retail', icon: ShoppingBag },
  { id: '8', name: 'Health/Beauty', icon: Heart },
  { id: '9', name: 'Education', icon: GraduationCap },
  { id: '10', name: 'Non-Profit', icon: HandHeart },
  { id: '11', name: 'Community Organization', icon: Building },
  { id: '12', name: 'Sports Team', icon: Trophy },
  { id: '13', name: 'News/Media', icon: Newspaper },
  { id: '14', name: 'App/Website', icon: Smartphone },
  { id: '15', name: 'Other', icon: MoreHorizontal }
];

const PagesPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category_id: '',
    bio: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    location: ''
  });

  // Placeholder data
  const pages: any[] = [];
  const myPages: any[] = [];

  const handleCreatePage = async () => {
    if (!formData.name || !formData.slug || !formData.category_id) {
      toast({ description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast({ 
        description: 'Slug can only contain lowercase letters, numbers, and hyphens', 
        variant: 'destructive' 
      });
      return;
    }

    toast({ description: '✅ Page created successfully!' });
    setCreateDialogOpen(false);
    setFormData({
      name: '',
      slug: '',
      category_id: '',
      bio: '',
      contact_email: '',
      contact_phone: '',
      website_url: '',
      location: ''
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <BackNavigation title="Pages" />
      
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Pages</h1>
            <p className="text-muted-foreground">
              Create and manage your business pages
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Page
          </Button>
        </div>

        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="discover">
              <TrendingUp className="h-4 w-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="following">
              <CheckCircle className="h-4 w-4 mr-2" />
              Following
            </TabsTrigger>
            <TabsTrigger value="my-pages">
              <Users className="h-4 w-4 mr-2" />
              My Pages
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="discover" className="space-y-4">
            {pages.length === 0 && (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No pages yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a page!
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  Create Your First Page
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-2">No followed pages</h3>
              <p className="text-sm text-muted-foreground">
                Pages you follow will appear here
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="my-pages" className="space-y-4">
            {myPages.length === 0 && (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create your first page</h3>
                <p className="text-muted-foreground mb-4">
                  Build your brand and connect with your audience
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Page
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Page Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Page</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Page Name *</Label>
                <Input
                  placeholder="e.g., My Coffee Shop"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      name: e.target.value,
                      slug: prev.slug || generateSlug(e.target.value)
                    }));
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Page URL (Slug) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">postup.com/page/</span>
                  <Input
                    placeholder="my-coffee-shop"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                    }))}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.id} value={cat.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell people about your page..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    placeholder="contact@example.com"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Auto-Verification Criteria</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 100+ posts on page</li>
                  <li>• 1,000+ followers</li>
                  <li>• Active for 90+ days</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreatePage}
                >
                  Create Page
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default PagesPage;
