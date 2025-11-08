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

          {/* Chat Bubble Color */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label>Chat Bubble Color</Label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => updateSettings({ theme_color: 'default' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  (!settings?.theme_color || settings.theme_color === 'default')
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: 'hsl(var(--primary))' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'blue' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'blue'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#3b82f6' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'green' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'green'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#10b981' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'purple' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'purple'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#a855f7' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'pink' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'pink'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#ec4899' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'orange' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'orange'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#f97316' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'red' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'red'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#ef4444' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'teal' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'teal'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#14b8a6' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'yellow' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'yellow'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#eab308' }}
              />
              <button
                onClick={() => updateSettings({ theme_color: 'indigo' })}
                className={`h-12 rounded-lg border-2 transition-all ${
                  settings?.theme_color === 'indigo'
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
                style={{ backgroundColor: '#6366f1' }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Your chat bubbles will use this color</p>
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
