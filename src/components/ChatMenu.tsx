import { useState } from 'react';
import { MoreVertical, User, Image, BellOff, Download, AlertCircle, Star, Palette, Sparkles, Trash2, Search, Ban, FileText, UserX, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { toast } from '@/hooks/use-toast';

interface ChatMenuProps {
  chatId: string;
  otherUserId?: string;
  onExportChat?: () => void;
  onViewMedia?: () => void;
  onReport?: () => void;
  onClearChat?: () => void;
  onBlock?: () => void;
  onSearchInChat?: () => void;
  onViewStarred?: () => void;
  onWallpaperChange?: () => void;
}

export const ChatMenu = ({ chatId, otherUserId, onExportChat, onViewMedia, onReport, onClearChat, onBlock, onSearchInChat, onViewStarred, onWallpaperChange }: ChatMenuProps) => {
  const { settings, setNickname, muteChat, unmuteChat, togglePin, setTheme } = useChatSettings(chatId);
  const { isBlocked, unblockUser } = useBlockedUsers();
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

  const handleExportChat = async () => {
    try {
      // Fetch all messages for export
      const { data: messages } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(display_name)')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!messages || messages.length === 0) {
        toast({
          title: 'No messages to export',
          description: 'This chat is empty',
        });
        return;
      }

      // Create text export
      const exportText = messages
        .map(msg => {
          const timestamp = new Date(msg.created_at).toLocaleString();
          const sender = msg.sender?.display_name || 'Unknown';
          return `[${timestamp}] ${sender}: ${msg.content || '[Media]'}`;
        })
        .join('\n');

      // Download as text file
      const blob = new Blob([exportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Chat exported',
        description: 'Chat history downloaded successfully',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: 'Could not export chat',
        variant: 'destructive',
      });
    }
    onExportChat?.();
  };

  const handleAISummary = async () => {
    try {
      // Fetch recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select('content')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!messages || messages.length === 0) {
        toast({
          title: 'No messages',
          description: 'This chat has no messages to summarize',
        });
        return;
      }

      const messageCount = messages.length;
      const hasMedia = messages.some(m => !m.content);
      
      toast({
        title: 'Chat Summary',
        description: `This chat has ${messageCount} recent messages${hasMedia ? ', including media files' : ''}. Full AI summary is a premium feature.`,
      });
    } catch (error) {
      toast({
        title: 'Summary failed',
        variant: 'destructive',
      });
    }
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
          <DropdownMenuItem onClick={onSearchInChat}>
            <Search className="mr-2 h-4 w-4" />
            Search in Chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onViewStarred}>
            <Star className="mr-2 h-4 w-4" />
            Starred Messages
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowThemeDialog(true)}>
            <Palette className="mr-2 h-4 w-4" />
            Change Theme
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onWallpaperChange}>
            <Image className="mr-2 h-4 w-4" />
            Change Wallpaper
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
          {otherUserId && (
            <>
              {isBlocked(otherUserId) ? (
                <DropdownMenuItem 
                  onClick={() => unblockUser(otherUserId)}
                  className="text-green-600"
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Unblock User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={onBlock} className="text-destructive">
                  <Ban className="mr-2 h-4 w-4" />
                  Block User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onReport} className="text-destructive">
                <AlertCircle className="mr-2 h-4 w-4" />
                Report User
              </DropdownMenuItem>
            </>
          )}
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