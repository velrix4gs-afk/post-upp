import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Save, Loader2, X, ImagePlus } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BIO_MAX_LENGTH = 500;

export const ProfileEditModal = ({ open, onOpenChange }: ProfileEditModalProps) => {
  const { profile, updateProfile, uploadAvatar, uploadCover } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    display_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    gender: '',
    is_private: false
  });

  // Prefill form when profile loads or modal opens
  useEffect(() => {
    if (profile && open) {
      const data = {
        display_name: profile.display_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        is_private: profile.is_private || false
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [profile, open]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      toast({ title: 'Avatar updated!', duration: 1500 });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive', duration: 1500 });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Cover must be less than 10MB', variant: 'destructive' });
      return;
    }

    setIsUploadingCover(true);
    try {
      await uploadCover(file);
      toast({ title: 'Cover photo updated!', duration: 1500 });
    } catch (error) {
      toast({ title: 'Upload failed', variant: 'destructive', duration: 1500 });
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!originalData) return;

    // Detect only changed fields
    const changes: any = {};
    Object.keys(formData).forEach((key) => {
      if (formData[key as keyof typeof formData] !== originalData[key]) {
        changes[key] = formData[key as keyof typeof formData];
      }
    });

    if (Object.keys(changes).length === 0) {
      toast({ title: 'No changes to save' });
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const updatedChanges = { ...changes, is_profile_complete: true };
      await updateProfile(updatedChanges);
      toast({ title: 'Profile updated!', duration: 1500 });
      onOpenChange(false);
    } catch (error: any) {
      toast({ 
        title: error.message?.includes('username') ? 'Username taken' : 'Update failed',
        variant: 'destructive',
        duration: 1500
      });
    } finally {
      setIsSaving(false);
    }
  };

  const bioLength = formData.bio.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Cover Photo Section */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-t-lg overflow-hidden">
          {profile?.cover_url && (
            <img 
              src={profile.cover_url} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          )}
          <label htmlFor="cover-upload" className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            {isUploadingCover ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <ImagePlus className="h-5 w-5" />
                Change Cover
              </div>
            )}
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
            disabled={isUploadingCover}
          />
          
          {/* Close button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Avatar - positioned to overlap cover */}
        <div className="relative px-6 -mt-12">
          <div className="relative inline-block">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-2xl bg-muted">
                {formData.display_name[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90 transition-colors shadow-md"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 pb-6 pt-4 space-y-5">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-semibold">Edit Profile</DialogTitle>
          </DialogHeader>

          {/* Display Name & Username row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm font-medium">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Your name"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Username <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="username"
                  className="h-10 pl-8"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
              <span className={`text-xs ${bioLength > BIO_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                {bioLength}/{BIO_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, BIO_MAX_LENGTH) })}
              placeholder="Tell us about yourself..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gender</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location & Website row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className="text-sm font-medium">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
                className="h-10"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 890"
              className="h-10"
            />
          </div>

          {/* Private Account */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <div>
              <Label htmlFor="is_private" className="text-sm font-medium cursor-pointer">Private Account</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Only followers can see your posts</p>
            </div>
            <Switch
              id="is_private"
              checked={formData.is_private}
              onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1 h-10"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};