import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Save, X, Upload, User, Shield, MapPin } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { showCleanError } from '@/lib/errorHandler';

interface ProfileEditProps {
  onClose: () => void;
}

const ProfileEdit = ({ onClose }: ProfileEditProps) => {
  const { user } = useAuth();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
    location: profile?.location || '',
    website: profile?.website || '',
    relationship_status: profile?.relationship_status || '',
    birth_date: profile?.birth_date || '',
    gender: profile?.gender || '',
    phone: profile?.phone || '',
    is_private: profile?.is_private || false
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        showCleanError({ code: 'UPLOAD_001', message: 'Image must be less than 5MB' }, toast);
        return;
      }

    setIsUploading(true);
    try {
      await uploadAvatar(file);
      toast({
        title: 'Success',
        description: 'Profile picture updated!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showCleanError({ code: 'UPLOAD_001', message: 'Cover image must be less than 5MB' }, toast);
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      await updateProfile({ cover_url: publicUrl });
      
      toast({
        title: 'Success',
        description: 'Cover photo updated!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload cover image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must be a valid URL (start with http:// or https://)';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-card border-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit Profile</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Cover Photo Section */}
          <div className="relative mb-6 h-48 rounded-lg overflow-hidden bg-gradient-to-r from-primary/20 to-secondary/20">
            {profile?.cover_url && (
              <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-4 right-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                id="cover-upload"
                disabled={isUploading}
              />
              <label htmlFor="cover-upload">
                <Button size="sm" variant="secondary" asChild disabled={isUploading}>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Change Cover'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Avatar Section */}
          <div className="flex items-center space-x-6 mb-6 -mt-16 px-4">
            <div className="relative group">
              <Avatar className="h-32 w-32 ring-4 ring-background">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Profile picture" />
                ) : (
                  <AvatarFallback className="bg-gradient-primary text-white text-3xl">
                    {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                id="avatar-upload"
                disabled={isUploading}
              />
              <label 
                htmlFor="avatar-upload"
                className="absolute inset-0 cursor-pointer rounded-full"
                title="Upload profile picture"
              />
              <div className="absolute bottom-0 right-0 pointer-events-none">
                <Button size="sm" className="h-10 w-10 rounded-full p-0 pointer-events-auto" asChild disabled={isUploading}>
                  <label htmlFor="avatar-upload" className="cursor-pointer flex items-center justify-center">
                    <Camera className="h-4 w-4" />
                  </label>
                </Button>
              </div>
            </div>
            <div className="mt-16 flex-1">
              <h3 className="font-semibold text-xl">{profile?.display_name}</h3>
              <p className="text-muted-foreground">@{profile?.username}</p>
              {isUploading && (
                <p className="text-sm text-primary mt-2">Uploading image...</p>
              )}
            </div>
          </div>

          {/* Tabbed Form */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <User className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="contact">
                <MapPin className="h-4 w-4 mr-2" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="privacy">
                <Shield className="h-4 w-4 mr-2" />
                Privacy
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="Your full name"
                    className={errors.display_name ? 'border-destructive' : ''}
                  />
                  {errors.display_name && (
                    <p className="text-xs text-destructive mt-1">{errors.display_name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    placeholder="username"
                    className={errors.username ? 'border-destructive' : ''}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive mt-1">{errors.username}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  className={errors.bio ? 'border-destructive' : ''}
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.bio && (
                    <p className="text-xs text-destructive">{errors.bio}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.bio.length}/500 characters
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="birth_date">Birth Date</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="relationship_status">Relationship Status</Label>
                <Select
                  value={formData.relationship_status}
                  onValueChange={(value) => setFormData({ ...formData, relationship_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_specified">Not specified</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="in_relationship">In a relationship</SelectItem>
                    <SelectItem value="engaged">Engaged</SelectItem>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="complicated">It's complicated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                  className={errors.website ? 'border-destructive' : ''}
                />
                {errors.website && (
                  <p className="text-xs text-destructive mt-1">{errors.website}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="is_private" className="text-base font-semibold">
                      Private Account
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When your account is private, only people you approve can see your posts and follow you.
                    </p>
                  </div>
                  <Switch
                    id="is_private"
                    checked={formData.is_private}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                  />
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Privacy Tips</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Private accounts require follower approval</li>
                    <li>Your profile picture and username are always public</li>
                    <li>Posts are only visible to approved followers</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || isUploading}
              className="bg-gradient-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileEdit;
