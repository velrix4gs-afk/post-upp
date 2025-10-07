import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Camera, Save, X } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

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
    status_message: profile?.status_message || '',
    is_private: profile?.is_private || false
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await uploadAvatar(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-card border-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Edit Profile</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Avatar Section */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                  {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button size="sm" className="h-8 w-8 rounded-full p-0" asChild>
                    <span className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{profile?.display_name}</h3>
              <p className="text-muted-foreground">@{profile?.username}</p>
              {isUploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>

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
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://yourwebsite.com"
                />
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
                />
              </div>

              <div>
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
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

            <div>
              <Label htmlFor="status_message">Status Message</Label>
              <Input
                id="status_message"
                type="text"
                placeholder="What's on your mind?"
                value={formData.status_message}
                onChange={(e) => setFormData({ ...formData, status_message: e.target.value })}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.status_message.length}/100 characters
              </p>
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
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="in_relationship">In a relationship</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="complicated">It's complicated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Privacy Settings */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Privacy</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is_private">Private Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Only approved followers can see your posts
                  </p>
                </div>
                <Switch
                  id="is_private"
                  checked={formData.is_private}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked })}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
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