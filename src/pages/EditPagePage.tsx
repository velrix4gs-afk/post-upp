import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Upload, Loader2, Save, Trash2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { BackNavigation } from '@/components/BackNavigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { logError } from '@/lib/errorLogger';

const EditPagePage = () => {
  const navigate = useNavigate();
  const { pageId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPage();
  }, [pageId]);

  const loadPage = async () => {
    if (!pageId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('creator_pages')
        .select('*')
        .eq('id', pageId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) {
        toast({ title: 'Page not found' });
        navigate('/pages');
        return;
      }

      setTitle(data.title);
      setSlug(data.slug);
      setBio(data.bio || '');
      setCoverPreview(data.cover_url);
      setProfilePreview(data.profile_url);
      setIsPublished(data.is_published ?? true);
    } catch (error: any) {
      await logError({
        message: error.message,
        type: 'page_load_error',
        context: { pageId },
        userId: user?.id,
        componentName: 'EditPagePage'
      });
      toast({ title: 'Unable to load page' });
      navigate('/pages');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large (max 5MB)' });
      return;
    }
    
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleProfileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image too large (max 5MB)' });
      return;
    }
    
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !slug.trim()) {
      toast({ title: 'Please fill in required fields' });
      return;
    }

    setSaving(true);
    try {
      let coverUrl = coverPreview;
      let profileUrl = profilePreview;

      // Upload new cover if changed
      if (coverImage) {
        const coverPath = `pages/${user.id}/cover-${Date.now()}.${coverImage.name.split('.').pop()}`;
        const { error: coverError } = await supabase.storage
          .from('media')
          .upload(coverPath, coverImage);
        
        if (!coverError) {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(coverPath);
          coverUrl = publicUrl;
        }
      }

      // Upload new profile if changed
      if (profileImage) {
        const profilePath = `pages/${user.id}/profile-${Date.now()}.${profileImage.name.split('.').pop()}`;
        const { error: profileError } = await supabase.storage
          .from('media')
          .upload(profilePath, profileImage);
        
        if (!profileError) {
          const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(profilePath);
          profileUrl = publicUrl;
        }
      }

      // Update page
      const { error } = await supabase
        .from('creator_pages')
        .update({
          title,
          slug,
          bio,
          cover_url: coverUrl,
          profile_url: profileUrl,
          is_published: isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Page updated! ✨' });
      navigate('/pages');
    } catch (error: any) {
      await logError({
        message: error.message,
        type: 'page_update_error',
        context: { pageId, title, slug },
        userId: user?.id,
        componentName: 'EditPagePage'
      });
      toast({ title: 'Unable to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !pageId) return;

    try {
      const { error } = await supabase
        .from('creator_pages')
        .delete()
        .eq('id', pageId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Page deleted' });
      navigate('/pages');
    } catch (error: any) {
      await logError({
        message: error.message,
        type: 'page_delete_error',
        context: { pageId },
        userId: user?.id,
        componentName: 'EditPagePage'
      });
      toast({ title: 'Unable to delete page' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <BackNavigation />
          <h1 className="text-xl font-bold">Edit Page</h1>
          <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Cover Image */}
        <Card className="overflow-hidden">
          <div
            className="h-48 bg-muted flex items-center justify-center cursor-pointer relative group"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white" />
                </div>
              </>
            ) : (
              <div className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Add cover image</p>
              </div>
            )}
          </div>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
        </Card>

        {/* Profile Image */}
        <div className="flex items-center gap-4">
          <div
            className="w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden group relative"
            onClick={() => profileInputRef.current?.click()}
          >
            {profilePreview ? (
              <>
                <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </>
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">Profile Picture</p>
            <p className="text-sm text-muted-foreground">Click to upload</p>
          </div>
          <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileSelect} className="hidden" />
        </div>

        {/* Page Details */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Page Title *</Label>
            <Input
              id="title"
              placeholder="e.g., My Brand"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="slug">Page URL *</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">postup.com/page/</span>
              <Input
                id="slug"
                placeholder="my-brand"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                maxLength={50}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell people about your page..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{bio.length}/300</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Publish Status</p>
              <p className="text-sm text-muted-foreground">Make page visible to others</p>
            </div>
            <Button
              variant={isPublished ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsPublished(!isPublished)}
            >
              {isPublished ? 'Published' : 'Draft'}
            </Button>
          </div>
        </div>

        {/* Delete Section */}
        <Card className="border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-1">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Once deleted, this page cannot be recovered
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Page
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Page?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditPagePage;
