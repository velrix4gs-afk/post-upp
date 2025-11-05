import { useState } from 'react';
import { useCreatorPages } from '@/hooks/useCreatorPages';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export const CreatorStudio = () => {
  const { pages, loading, createPage, updatePage, deletePage, togglePublish, checkSlugAvailability } = useCreatorPages();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    bio: '',
    is_published: false
  });
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const handleSlugChange = async (slug: string) => {
    const formatted = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData(prev => ({ ...prev, slug: formatted }));
    
    if (formatted.length >= 3) {
      setSlugChecking(true);
      const available = await checkSlugAvailability(formatted, editingPage?.id);
      setSlugAvailable(available);
      setSlugChecking(false);
    } else {
      setSlugAvailable(null);
    }
  };

  const handleSubmit = async () => {
    if (editingPage) {
      const success = await updatePage(editingPage.id, formData);
      if (success) {
        setIsCreateOpen(false);
        setEditingPage(null);
        resetForm();
      }
    } else {
      const page = await createPage(formData);
      if (page) {
        setIsCreateOpen(false);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      bio: '',
      is_published: false
    });
    setSlugAvailable(null);
  };

  const handleEdit = (page: any) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      bio: page.bio || '',
      is_published: page.is_published
    });
    setIsCreateOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Creator Studio</h2>
          <p className="text-muted-foreground">
            Create and manage your creator pages
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingPage(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPage ? 'Edit' : 'Create'} Creator Page</DialogTitle>
              <DialogDescription>
                Set up your public creator page with a custom URL
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="slug"
                      placeholder="my-creator-page"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      postup.com/creator/{formData.slug || 'your-slug'}
                    </p>
                  </div>
                  {slugChecking && <Loader2 className="h-4 w-4 animate-spin mt-2" />}
                  {slugAvailable === true && <span className="text-green-600 text-sm mt-2">✓ Available</span>}
                  {slugAvailable === false && <span className="text-red-600 text-sm mt-2">✗ Taken</span>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  placeholder="My Creator Page"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell your audience about yourself..."
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Publish Page</Label>
                <Switch
                  id="published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.slug || !formData.title || slugAvailable === false}
                >
                  {editingPage ? 'Update' : 'Create'} Page
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {pages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No creator pages yet</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Page
              </Button>
            </CardContent>
          </Card>
        ) : (
          pages.map((page) => (
            <Card key={page.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{page.title}</CardTitle>
                    <CardDescription>
                      postup.com/creator/{page.slug}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {page.is_published && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/creator/${page.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Creator Page</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deletePage(page.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Published</Label>
                      <Switch
                        checked={page.is_published}
                        onCheckedChange={(checked) => togglePublish(page.id, checked)}
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => handleEdit(page)}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
