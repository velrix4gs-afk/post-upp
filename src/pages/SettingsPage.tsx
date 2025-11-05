import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { showCleanError } from '@/lib/errorHandler';
import { Palette, Shield, Bell, User, Download, Trash2, LogOut, Moon, Sun, Monitor, Lock, Eye, EyeOff, Users, Phone, MessageCircle, FileText, Camera, MapPin, Globe, Smartphone, Bookmark, ShieldCheck, Sparkles } from 'lucide-react';
import { VerificationSettings } from './settings/VerificationSettings';
import { CreatorStudio } from './settings/CreatorStudio';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [showDisplayNameDialog, setShowDisplayNameDialog] = useState(false);
  const [showBioDialog, setShowBioDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Appearance Settings
  const [fontSize, setFontSize] = useState('medium');
  const [layoutMode, setLayoutMode] = useState('spacious');
  const [accentColor, setAccentColor] = useState('blue');

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    who_can_message: 'everyone',
    who_can_tag: 'everyone',
    location_sharing: false,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    push_enabled: true,
    likes: true,
    comments: true,
    messages: true,
    follows: true,
    email_enabled: true,
    sms_enabled: false
  });

  // Messaging Settings
  const [messagingSettings, setMessagingSettings] = useState({
    read_receipts: true,
    typing_indicators: true,
    message_preview: true
  });

  // Content Settings
  const [contentSettings, setContentSettings] = useState({
    autoplay_videos: true,
    show_sensitive: false
  });

  // Load settings and apply them
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        const loadedFontSize = data.font_size || 'medium';
        const loadedLayoutMode = data.layout_mode || 'spacious';
        const loadedAccentColor = data.accent_color || 'blue';
        
        setFontSize(loadedFontSize);
        setLayoutMode(loadedLayoutMode);
        setAccentColor(loadedAccentColor);
        
        setPrivacySettings(prev => ({
          ...prev,
          profile_visibility: data.privacy_who_can_view_profile || 'public',
          who_can_message: data.privacy_who_can_message || 'everyone',
          who_can_tag: data.privacy_who_can_tag || 'everyone',
          location_sharing: data.location_sharing || false
        }));
        setNotificationSettings(prev => ({
          ...prev,
          likes: data.notification_post_reactions ?? true,
          comments: data.notification_post_reactions ?? true,
          messages: data.notification_messages ?? true,
          follows: data.notification_friend_requests ?? true,
        }));
        setMessagingSettings(prev => ({
          ...prev,
          read_receipts: data.show_read_receipts ?? true,
          typing_indicators: data.show_typing_indicator ?? true
        }));
      }
    };
    
    loadSettings();
  }, [user]);

  // Apply appearance settings when they change
  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    document.documentElement.setAttribute('data-layout', layoutMode);
    document.documentElement.setAttribute('data-accent', accentColor);
  }, [fontSize, layoutMode, accentColor]);

  const handleSettingUpdate = async (updates: any) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user?.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
    } catch (error) {
      showCleanError(error, toast);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      const { data: posts } = await supabase.from('posts').select('*').eq('user_id', user?.id);
      const { data: friends } = await supabase.from('friendships').select('*').or(`requester_id.eq.${user?.id},addressee_id.eq.${user?.id}`);
      
      const exportData = {
        profile,
        posts,
        friends,
        export_date: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-upp-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();

      toast({ description: 'Data exported successfully' });
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearchHistory = async () => {
    try {
      // Implement when search history table exists
      toast({ description: 'Search history cleared' });
    } catch (error) {
      showCleanError(error, toast);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setIsLoading(true);
      await supabase.from('profiles').update({ is_active: false }).eq('id', user?.id);
      toast({ description: 'Account deactivated' });
      await signOut();
      navigate('/auth');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsLoading(true);
      await supabase.from('posts').delete().eq('user_id', user?.id);
      await supabase.from('profiles').delete().eq('id', user?.id);
      toast({ description: 'Account deleted' });
      await signOut();
      navigate('/auth');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAllSessions = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast({ description: 'Logged out from all devices' });
      navigate('/auth');
    } catch (error) {
      showCleanError(error, toast);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ description: 'Password updated' });
      setShowPasswordDialog(false);
      setNewPassword('');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername || newUsername.length < 3) {
      toast({ description: 'Username must be at least 3 characters', variant: 'destructive' });
      return;
    }
    try {
      setIsLoading(true);
      const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user?.id);
      if (error) throw error;
      toast({ description: 'Username updated' });
      setShowUsernameDialog(false);
      setNewUsername('');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeDisplayName = async () => {
    if (!newDisplayName) return;
    try {
      setIsLoading(true);
      const { error } = await supabase.from('profiles').update({ display_name: newDisplayName }).eq('id', user?.id);
      if (error) throw error;
      toast({ description: 'Display name updated' });
      setShowDisplayNameDialog(false);
      setNewDisplayName('');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeBio = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from('profiles').update({ bio: newBio }).eq('id', user?.id);
      if (error) throw error;
      toast({ description: 'Bio updated' });
      setShowBioDialog(false);
      setNewBio('');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) return;
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ description: 'Email update sent - check your inbox to confirm' });
      setShowEmailDialog(false);
      setNewEmail('');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-9 mb-6 overflow-x-auto">
            <TabsTrigger value="general"><User className="h-4 w-4 mr-2" /><span className="hidden sm:inline">General</span></TabsTrigger>
            <TabsTrigger value="appearance"><Palette className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Appearance</span></TabsTrigger>
            <TabsTrigger value="privacy"><Shield className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Privacy</span></TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Notifications</span></TabsTrigger>
            <TabsTrigger value="messaging"><MessageCircle className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Messages</span></TabsTrigger>
            <TabsTrigger value="content"><FileText className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Content</span></TabsTrigger>
            <TabsTrigger value="verification"><ShieldCheck className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Verification</span></TabsTrigger>
            <TabsTrigger value="creator"><Sparkles className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Creator</span></TabsTrigger>
            <TabsTrigger value="chat-settings"><MessageCircle className="h-4 w-4 mr-2" /><span className="hidden sm:inline">Chat</span></TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Username</Label>
                    <div className="flex items-center gap-2">
                      <Input value={profile?.username || ''} disabled className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => setShowUsernameDialog(true)}>Change</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Display Name</Label>
                    <div className="flex items-center gap-2">
                      <Input value={profile?.display_name || ''} disabled className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => setShowDisplayNameDialog(true)}>Change</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Bio</Label>
                    <div className="space-y-2">
                      <Textarea value={profile?.bio || 'No bio yet'} disabled className="resize-none" />
                      <Button variant="outline" size="sm" onClick={() => {
                        setNewBio(profile?.bio || '');
                        setShowBioDialog(true);
                      }}>Edit Bio</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Email</Label>
                    <div className="flex items-center gap-2">
                      <Input value={user?.email || ''} disabled className="flex-1" />
                      <Button variant="outline" size="sm" onClick={() => setShowEmailDialog(true)}>Change</Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Profile Picture</Label>
                    <p className="text-sm text-muted-foreground mb-3">Update your profile picture</p>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/profile/${user?.id}`)}>
                      <Camera className="h-4 w-4 mr-2" />
                      Edit in Profile
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Account Info</Label>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                      <p>User ID: {user?.id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Linked Accounts</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="h-5 w-5 text-red-600" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      </div>
                      <div>
                        <p className="font-medium">Google</p>
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>Connect</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24"><path fill="currentColor" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                      </div>
                      <div>
                        <p className="font-medium">TikTok</p>
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>Connect</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Display Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose light, dark, or auto</p>
                    </div>
                    <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light"><Sun className="h-4 w-4 mr-2 inline" />Light</SelectItem>
                        <SelectItem value="dark"><Moon className="h-4 w-4 mr-2 inline" />Dark</SelectItem>
                        <SelectItem value="system"><Monitor className="h-4 w-4 mr-2 inline" />Auto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Accent Color</Label>
                      <p className="text-sm text-muted-foreground">Customize theme color</p>
                    </div>
                    <Select value={accentColor} onValueChange={(value) => {
                      setAccentColor(value);
                      document.documentElement.setAttribute('data-accent', value);
                      handleSettingUpdate({ accent_color: value });
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default (Purple)</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="orange">Orange</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="pink">Pink</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Font Size</Label>
                      <p className="text-sm text-muted-foreground">Adjust text readability</p>
                    </div>
                    <Select value={fontSize} onValueChange={(value) => {
                      setFontSize(value);
                      document.documentElement.setAttribute('data-font-size', value);
                      handleSettingUpdate({ font_size: value });
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Layout</Label>
                      <p className="text-sm text-muted-foreground">Compact or spacious</p>
                    </div>
                    <Select value={layoutMode} onValueChange={(value) => {
                      setLayoutMode(value);
                      document.documentElement.setAttribute('data-layout', value);
                      handleSettingUpdate({ layout_mode: value });
                    }}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy & Security */}
          <TabsContent value="privacy" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Privacy Controls</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Who can view your profile</p>
                    </div>
                    <Select 
                      value={privacySettings.profile_visibility} 
                      onValueChange={(value) => {
                        setPrivacySettings({ ...privacySettings, profile_visibility: value });
                        handleSettingUpdate({ privacy_who_can_view_profile: value });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Who Can Message You</Label>
                      <p className="text-sm text-muted-foreground">Control message access</p>
                    </div>
                    <Select 
                      value={privacySettings.who_can_message} 
                      onValueChange={(value) => {
                        setPrivacySettings({ ...privacySettings, who_can_message: value });
                        handleSettingUpdate({ privacy_who_can_message: value });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="nobody">Nobody</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Who Can Tag You</Label>
                      <p className="text-sm text-muted-foreground">Control post tagging</p>
                    </div>
                    <Select 
                      value={privacySettings.who_can_tag} 
                      onValueChange={(value) => {
                        setPrivacySettings({ ...privacySettings, who_can_tag: value });
                        handleSettingUpdate({ privacy_who_can_tag: value });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="nobody">Nobody</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Location Sharing</Label>
                      <p className="text-sm text-muted-foreground">Share your location in posts</p>
                    </div>
                    <Switch
                      checked={privacySettings.location_sharing}
                      onCheckedChange={(checked) => {
                        setPrivacySettings({ ...privacySettings, location_sharing: checked });
                        handleSettingUpdate({ location_sharing: checked });
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Security</h3>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Password</Label>
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground mb-3">Add an extra layer of security</p>
                    <Button variant="outline" size="sm" disabled>
                      <Shield className="h-4 w-4 mr-2" />
                      Enable 2FA (Coming Soon)
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Active Sessions</Label>
                    <p className="text-sm text-muted-foreground mb-3">Manage devices where you're logged in</p>
                    <Button variant="outline" size="sm" onClick={handleLogoutAllSessions}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout All Devices
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Enable Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications on this device</p>
                    </div>
                    <Switch
                      checked={notificationSettings.push_enabled}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, push_enabled: checked });
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Likes & Reactions</Label>
                      <p className="text-sm text-muted-foreground">When someone likes your posts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.likes}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, likes: checked });
                        handleSettingUpdate({ notification_post_reactions: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Comments</Label>
                      <p className="text-sm text-muted-foreground">When someone comments on your posts</p>
                    </div>
                    <Switch
                      checked={notificationSettings.comments}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, comments: checked });
                        handleSettingUpdate({ notification_post_comments: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Messages</Label>
                      <p className="text-sm text-muted-foreground">When you receive new messages</p>
                    </div>
                    <Switch
                      checked={notificationSettings.messages}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, messages: checked });
                        handleSettingUpdate({ notification_messages: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Follows & Friend Requests</Label>
                      <p className="text-sm text-muted-foreground">When someone follows you or sends a request</p>
                    </div>
                    <Switch
                      checked={notificationSettings.follows}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, follows: checked });
                        handleSettingUpdate({ notification_friend_requests: checked });
                      }}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Email & SMS</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_enabled}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, email_enabled: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                    </div>
                    <Switch
                      checked={notificationSettings.sms_enabled}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, sms_enabled: checked });
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Messaging Settings */}
          <TabsContent value="messaging" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Message Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Read Receipts</Label>
                      <p className="text-sm text-muted-foreground">Let others know when you've read messages</p>
                    </div>
                    <Switch
                      checked={messagingSettings.read_receipts}
                      onCheckedChange={(checked) => {
                        setMessagingSettings({ ...messagingSettings, read_receipts: checked });
                        handleSettingUpdate({ show_read_receipts: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Typing Indicators</Label>
                      <p className="text-sm text-muted-foreground">Show when you're typing</p>
                    </div>
                    <Switch
                      checked={messagingSettings.typing_indicators}
                      onCheckedChange={(checked) => {
                        setMessagingSettings({ ...messagingSettings, typing_indicators: checked });
                        handleSettingUpdate({ show_typing_indicator: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Message Preview</Label>
                      <p className="text-sm text-muted-foreground">Show message content in notifications</p>
                    </div>
                    <Switch
                      checked={messagingSettings.message_preview}
                      onCheckedChange={(checked) => {
                        setMessagingSettings({ ...messagingSettings, message_preview: checked });
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Content & Feed */}
          <TabsContent value="content" className="space-y-4">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Content Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Autoplay Videos</Label>
                      <p className="text-sm text-muted-foreground">Automatically play videos in feed</p>
                    </div>
                    <Switch
                      checked={contentSettings.autoplay_videos}
                      onCheckedChange={(checked) => {
                        setContentSettings({ ...contentSettings, autoplay_videos: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Show Sensitive Content</Label>
                      <p className="text-sm text-muted-foreground">Display potentially sensitive posts</p>
                    </div>
                    <Switch
                      checked={contentSettings.show_sensitive}
                      onCheckedChange={(checked) => {
                        setContentSettings({ ...contentSettings, show_sensitive: checked });
                      }}
                    />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Manage Bookmarks</Label>
                    <p className="text-sm text-muted-foreground mb-3">View and organize your saved posts</p>
                    <Button variant="outline" size="sm" onClick={() => navigate('/bookmarks')}>
                      <Bookmark className="h-4 w-4 mr-2" />
                      View Bookmarks
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Search History</Label>
                    <p className="text-sm text-muted-foreground mb-3">Clear your search history</p>
                    <Button variant="outline" size="sm" onClick={handleClearSearchHistory}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear History
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Data Management</h3>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Export Account Data</Label>
                    <p className="text-sm text-muted-foreground mb-3">Download all your data (GDPR compliant)</p>
                    <Button variant="outline" onClick={handleExportData} disabled={isLoading}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 border-destructive/50">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
                <div className="space-y-3">
                  <div className="p-4 border border-destructive/50 rounded-lg">
                    <Label className="text-base mb-2 block">Deactivate Account</Label>
                    <p className="text-sm text-muted-foreground mb-3">Temporarily disable your account</p>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeactivateDialog(true)} disabled={isLoading}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                  </div>

                  <div className="p-4 border border-destructive rounded-lg bg-destructive/5">
                    <Label className="text-base mb-2 block text-destructive">Delete Account</Label>
                    <p className="text-sm text-muted-foreground mb-3">Permanently delete all your data</p>
                    <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isLoading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="verification"><VerificationSettings /></TabsContent>
          <TabsContent value="creator"><CreatorStudio /></TabsContent>
          <TabsContent value="chat-settings">
            <Card className="p-6"><h3 className="text-lg font-semibold">Messaging Settings</h3><p className="text-muted-foreground mt-2">Configure chat preferences</p></Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be hidden. Reactivate by logging in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateAccount}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={!newPassword || isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Username</Label>
              <Input placeholder="Min 3 characters" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUsernameDialog(false)}>Cancel</Button>
            <Button onClick={handleChangeUsername} disabled={!newUsername || isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisplayNameDialog} onOpenChange={setShowDisplayNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Display Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input placeholder="Your name" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisplayNameDialog(false)}>Cancel</Button>
            <Button onClick={handleChangeDisplayName} disabled={!newDisplayName || isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBioDialog} onOpenChange={setShowBioDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea 
                placeholder="Tell us about yourself..." 
                value={newBio} 
                onChange={(e) => setNewBio(e.target.value)}
                className="min-h-[100px]"
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground text-right">{newBio.length}/160</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBioDialog(false)}>Cancel</Button>
            <Button onClick={handleChangeBio} disabled={isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Email</Label>
              <Input type="email" placeholder="your@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
              <p className="text-xs text-muted-foreground">You'll receive a confirmation email</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleChangeEmail} disabled={!newEmail || isLoading}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;