import { useState } from 'react';
import { MoreVertical, User, Image, BellOff, Download, AlertCircle, Star, Palette, Sparkles, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatSettings } from '@/hooks/useChatSettings';
import { toast } from '@/hooks/use-toast';

interface ChatMenuProps {
  chatId: string;
  onExportChat?: () => void;
  onViewMedia?: () => void;
  onReport?: () => void;
  onClearChat?: () => void;
}

export const ChatMenu = ({ chatId, onExportChat, onViewMedia, onReport, onClearChat }: ChatMenuProps) => {
  const { settings, setNickname, muteChat, unmuteChat, togglePin, setTheme } = useChatSettings(chatId);
  const [showNicknameDialog, setShowNicknameDialog] = useState(false);
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [nickname, setNicknameInput] = useState('');
  const [muteDuration, setMuteDuration] = useState<string>('30');

  const handleSetNickname = async () => {
    if (nickname.trim()) {
      await setNickname(nickname.trim());
      setShowNicknameDialog(false);
      setNicknameInput('');
    }
  };

  const handleMute = async () => {
    const duration = muteDuration === 'forever' ? undefined : parseInt(muteDuration);
    await muteChat(duration);
    setShowMuteDialog(false);
  };

  const handleUnmute = async () => {
    await unmuteChat();
  };

  const handleThemeChange = async (color: string) => {
    await setTheme(color);
    setShowThemeDialog(false);
  };

  const handleExportChat = () => {
    toast({
      title: 'Export Chat',
      description: 'This feature is coming soon!',
    });
    onExportChat?.();
  };

  const handleAISummary = () => {
    toast({
      title: 'AI Summary',
      description: 'Premium feature - coming soon!',
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowNicknameDialog(true)}>
            <User className="mr-2 h-4 w-4" />
            Add Nickname
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onViewMedia}>
            <Image className="mr-2 h-4 w-4" />
            View Shared Media
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowThemeDialog(true)}>
            <Palette className="mr-2 h-4 w-4" />
            Change Theme
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={togglePin}>
            <Star className={`mr-2 h-4 w-4 ${settings?.is_pinned ? 'fill-current' : ''}`} />
            {settings?.is_pinned ? 'Unpin Chat' : 'Pin Chat'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => settings?.is_muted ? handleUnmute() : setShowMuteDialog(true)}>
            <BellOff className="mr-2 h-4 w-4" />
            {settings?.is_muted ? 'Unmute' : 'Mute Notifications'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleAISummary}>
            <Sparkles className="mr-2 h-4 w-4" />
            AI Summary (Premium)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportChat}>
            <Download className="mr-2 h-4 w-4" />
            Export Chat
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onClearChat}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onReport} className="text-destructive">
            <AlertCircle className="mr-2 h-4 w-4" />
            Report User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showNicknameDialog} onOpenChange={setShowNicknameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Nickname</DialogTitle>
            <DialogDescription>Choose a custom display name for this chat</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                placeholder="Enter nickname"
                value={nickname}
                onChange={(e) => setNicknameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSetNickname()}
              />
            </div>
            <Button onClick={handleSetNickname} className="w-full">
              Save Nickname
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMuteDialog} onOpenChange={setShowMuteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mute Notifications</DialogTitle>
            <DialogDescription>Choose how long to mute this chat</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={muteDuration} onValueChange={setMuteDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                  <SelectItem value="1440">1 day</SelectItem>
                  <SelectItem value="10080">1 week</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMute} className="w-full">
              Mute Chat
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showThemeDialog} onOpenChange={setShowThemeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Chat Theme</DialogTitle>
            <DialogDescription>Pick a color for this chat</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4">
            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'].map((color) => (
              <button
                key={color}
                onClick={() => handleThemeChange(color)}
                className="h-16 rounded-lg border-2 hover:scale-105 transition"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};