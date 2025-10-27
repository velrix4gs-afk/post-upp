import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useChatSettings } from '@/hooks/useChatSettings';
import { Palette, Image, Bell, Trash2, Shield } from 'lucide-react';

interface ChatSettingsDialogProps {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChatSettingsDialog = ({ chatId, open, onOpenChange }: ChatSettingsDialogProps) => {
  const { settings, updateSettings, toggleMute, togglePin } = useChatSettings(chatId);
  const [wallpaperUrl, setWallpaperUrl] = useState(settings?.wallpaper_url || '');

  const handleWallpaperChange = () => {
    updateSettings({ wallpaper_url: wallpaperUrl });
  };

  const handleAutoDeleteChange = (value: string) => {
    const duration = value === 'never' ? undefined : parseInt(value);
    updateSettings({ auto_delete_duration: duration });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Mute/Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="mute">Mute notifications</Label>
            </div>
            <Switch
              id="mute"
              checked={settings?.is_muted || false}
              onCheckedChange={toggleMute}
            />
          </div>

          {/* Pin Chat */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="pin">Pin this chat</Label>
            </div>
            <Switch
              id="pin"
              checked={settings?.is_pinned || false}
              onCheckedChange={togglePin}
            />
          </div>

          {/* Wallpaper */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <Label>Chat Wallpaper URL</Label>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/wallpaper.jpg"
                value={wallpaperUrl}
                onChange={(e) => setWallpaperUrl(e.target.value)}
              />
              <Button onClick={handleWallpaperChange} size="sm">
                Set
              </Button>
            </div>
          </div>

          {/* Theme Color */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label>Theme Color</Label>
            </div>
            <Select
              value={settings?.theme_color || 'default'}
              onValueChange={(value) => updateSettings({ theme_color: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="pink">Pink</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Auto-delete messages */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              <Label>Auto-delete messages</Label>
            </div>
            <Select
              value={settings?.auto_delete_duration?.toString() || 'never'}
              onValueChange={handleAutoDeleteChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Never" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="3600">1 hour</SelectItem>
                <SelectItem value="86400">24 hours</SelectItem>
                <SelectItem value="604800">7 days</SelectItem>
                <SelectItem value="2592000">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
