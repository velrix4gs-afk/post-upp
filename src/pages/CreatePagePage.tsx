import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { X, Upload, Loader2, Send, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { BackNavigation } from '@/components/BackNavigation';
import { logError } from '@/lib/errorLogger';

const CreatePagePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleProfileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Auto-generate slug
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleCreate = async () => {
    if (!user || !title.trim() || !slug.trim()) {
      toast({ title: 'Please fill in required fields' });
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      toast({ title: 'URL can only contain lowercase letters, numbers, and hyphens' });
      return;
    }

    setUploading(true);
    try {
      // Check slug availability
      const { data: existing } = await supabase
        .from('creator_pages')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        toast({ title: 'This URL is already taken' });
        setUploading(false);
        return;
      }

      let coverUrl = null;
      let profileUrl = null;

      // Upload cover image
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

      // Upload profile image
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

      // Create page
      const { data: newPage, error } = await supabase
        .from('creator_pages')
        .insert({
          user_id: user.id,
          title,
          slug,
          bio,
          cover_url: coverUrl,
          profile_url: profileUrl,
          is_published: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Page created! 🎉' });
      // Navigate to edit page
      navigate(`/page/${newPage.id}/edit`);
    } catch (error: any) {
      await logError({
        message: error.message,
        type: 'page_creation_error',
        context: { title, slug },
        userId: user?.id,
        componentName: 'CreatePagePage'
      });
      toast({ title: 'Unable to create page' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <BackNavigation />
          <h1 className="text-xl font-bold">Create Page</h1>
          <Button size="sm" onClick={handleCreate} disabled={uploading || !title.trim()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Cover Image */}
        <Card className="overflow-hidden">
          <div
            className="h-48 bg-muted flex items-center justify-center cursor-pointer relative"
            onClick={() => coverInputRef.current?.click()}
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
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
            className="w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => profileInputRef.current?.click()}
          >
            {profilePreview ? (
              <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
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
              onChange={(e) => handleTitleChange(e.target.value)}
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
                onChange={(e) => setSlug(e.target.value)}
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

          {/* Helpful tips */}
          <Card className="bg-primary/5 border-primary/20 p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Tips for a great page:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Choose a memorable URL</li>
                  <li>Add high-quality cover and profile images</li>
                  <li>Write a clear bio describing your page</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePagePage;
