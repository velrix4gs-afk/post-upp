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
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useTheme } from '@/hooks/useTheme';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { showCleanError } from '@/lib/errorHandler';
import { Palette, Shield, Bell, User, Download, Trash2, LogOut, Moon, Sun, Monitor, Lock, Eye, EyeOff, Users, Phone } from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { theme, setTheme } = useTheme();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');

  // Settings states
  const [notificationSettings, setNotificationSettings] = useState({
    push_enabled: true,
    likes: true,
    comments: true,
    messages: true,
    follows: true,
    email_enabled: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    post_visibility: 'public',
    friend_requests: 'everyone',
    online_status: true,
    show_activity: true
  });

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setNotificationSettings({
          push_enabled: true,
          likes: data.notification_post_reactions ?? true,
          comments: data.notification_post_reactions ?? true,
          messages: data.notification_messages ?? true,
          follows: data.notification_friend_requests ?? true,
          email_enabled: true
        });
        
        setPrivacySettings({
          profile_visibility: data.privacy_who_can_view_profile || 'public',
          post_visibility: 'public',
          friend_requests: 'everyone',
          online_status: true,
          show_activity: true
        });
      }
    };
    
    loadSettings();
  }, [user]);

  const handleSettingChange = async (table: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    } catch (error) {
      showCleanError(error, toast);
    }
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user data
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id);

      const exportData = {
        profile,
        posts,
        export_date: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `account-data-${new Date().toISOString()}.json`;
      a.click();

      toast({ description: 'Data exported successfully' });
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      setIsLoading(true);
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
      await supabase.auth.admin.deleteUser(user?.id!);
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
      toast({ description: 'Logged out from all sessions' });
      navigate('/auth');
    } catch (error) {
      showCleanError(error, toast);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ description: 'Password changed successfully' });
      setShowPasswordDialog(false);
      setNewPassword('');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user?.id);
      if (error) throw error;
      toast({ description: 'Username changed successfully' });
      setShowUsernameDialog(false);
      setNewUsername('');
    } catch (error) {
      showCleanError(error, toast);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="account">
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="danger">
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Danger Zone</span>
            </TabsTrigger>
          </TabsList>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Theme Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Theme</Label>
                      <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    </div>
                    <Select value={theme} onValueChange={(value: any) => setTheme(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center">
                            <Sun className="h-4 w-4 mr-2" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center">
                            <Moon className="h-4 w-4 mr-2" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center">
                            <Monitor className="h-4 w-4 mr-2" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Privacy & Visibility</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">Control who can view your profile</p>
                    </div>
                    <Select 
                      value={privacySettings.profile_visibility} 
                      onValueChange={(value) => {
                        setPrivacySettings({ ...privacySettings, profile_visibility: value });
                        handleSettingChange('user_settings', { privacy_who_can_view_profile: value });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends</SelectItem>
                        <SelectItem value="private">Only Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Friend Requests</Label>
                      <p className="text-sm text-muted-foreground">Who can send you friend requests</p>
                    </div>
                    <Select 
                      value={privacySettings.friend_requests} 
                      onValueChange={(value) => {
                        setPrivacySettings({ ...privacySettings, friend_requests: value });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="friends_of_friends">Friends of Friends</SelectItem>
                        <SelectItem value="nobody">Nobody</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Online Status</Label>
                      <p className="text-sm text-muted-foreground">Show when you're online</p>
                    </div>
                    <Switch
                      checked={privacySettings.online_status}
                      onCheckedChange={(checked) => {
                        setPrivacySettings({ ...privacySettings, online_status: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Activity Status</Label>
                      <p className="text-sm text-muted-foreground">Show your activity to others</p>
                    </div>
                    <Switch
                      checked={privacySettings.show_activity}
                      onCheckedChange={(checked) => {
                        setPrivacySettings({ ...privacySettings, show_activity: checked });
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive push notifications</p>
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
                      <Label className="text-base">Likes</Label>
                      <p className="text-sm text-muted-foreground">When someone likes your post</p>
                    </div>
                    <Switch
                      checked={notificationSettings.likes}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, likes: checked });
                        handleSettingChange('user_settings', { notification_post_reactions: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Comments</Label>
                      <p className="text-sm text-muted-foreground">When someone comments on your post</p>
                    </div>
                    <Switch
                      checked={notificationSettings.comments}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, comments: checked });
                        handleSettingChange('user_settings', { notification_post_reactions: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Messages</Label>
                      <p className="text-sm text-muted-foreground">When you receive a new message</p>
                    </div>
                    <Switch
                      checked={notificationSettings.messages}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, messages: checked });
                        handleSettingChange('user_settings', { notification_messages: checked });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Follows</Label>
                      <p className="text-sm text-muted-foreground">When someone follows you</p>
                    </div>
                    <Switch
                      checked={notificationSettings.follows}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, follows: checked });
                        handleSettingChange('user_settings', { notification_friend_requests: checked });
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications</p>
                    </div>
                    <Switch
                      checked={notificationSettings.email_enabled}
                      onCheckedChange={(checked) => {
                        setNotificationSettings({ ...notificationSettings, email_enabled: checked });
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Account Management</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Username</Label>
                    <div className="flex items-center gap-2">
                      <Input value={profile?.username || ''} disabled />
                      <Button variant="outline" size="sm" onClick={() => setShowUsernameDialog(true)}>
                        Change
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Email</Label>
                    <Input value={user?.email || ''} disabled />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Password</Label>
                    <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  </div>

                  <Separator />

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Export Your Data</Label>
                    <p className="text-sm text-muted-foreground mb-4">Download a copy of your data</p>
                    <Button variant="outline" onClick={handleExportData} disabled={isLoading}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label className="text-base mb-2 block">Sessions</Label>
                    <p className="text-sm text-muted-foreground mb-4">Logout from all devices</p>
                    <Button variant="outline" onClick={handleLogoutAllSessions}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout All Sessions
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Danger Zone */}
          <TabsContent value="danger">
            <Card className="p-6 space-y-6 border-destructive">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-destructive rounded-lg">
                    <Label className="text-base mb-2 block">Deactivate Account</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Temporarily deactivate your account. You can reactivate it anytime.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeactivateDialog(true)}
                      disabled={isLoading}
                    >
                      <EyeOff className="h-4 w-4 mr-2" />
                      Deactivate Account
                    </Button>
                  </div>

                  <div className="p-4 border border-destructive rounded-lg">
                    <Label className="text-base mb-2 block">Delete Account</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Permanently delete your account and all your data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account Permanently
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be temporarily deactivated. You can reactivate it anytime by logging in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateAccount}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Change Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your new password below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="New password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangePassword} disabled={!newPassword || isLoading}>
              Change Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Username Change Dialog */}
      <AlertDialog open={showUsernameDialog} onOpenChange={setShowUsernameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Username</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your new username below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              placeholder="New username" 
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeUsername} disabled={!newUsername || isLoading}>
              Change Username
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
