import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Chat } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { Forward } from 'lucide-react';

interface ForwardMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onForward: (chatIds: string[]) => void;
  chats: Chat[];
  currentChatId?: string;
}

export const ForwardMessageDialog = ({ 
  open, 
  onClose, 
  onForward, 
  chats,
  currentChatId 
}: ForwardMessageDialogProps) => {
  const { user } = useAuth();
  const [selectedChats, setSelectedChats] = useState<string[]>([]);

  const availableChats = chats.filter(chat => chat.id !== currentChatId);

  const toggleChat = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleForward = () => {
    if (selectedChats.length > 0) {
      onForward(selectedChats);
      setSelectedChats([]);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            Forward Message
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-64">
          {availableChats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No other chats available</p>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {availableChats.map((chat) => {
                const otherParticipant = chat.participants.find(p => p.user_id !== user?.id);
                const chatName = chat.name || otherParticipant?.profiles.display_name || 'Unknown';
                const avatar = chat.avatar_url || otherParticipant?.profiles.avatar_url;

                return (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => toggleChat(chat.id)}
                  >
                    <Checkbox 
                      checked={selectedChats.includes(chat.id)}
                      onCheckedChange={() => toggleChat(chat.id)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatar} />
                      <AvatarFallback>{chatName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{chatName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {chat.is_group ? `${chat.participants.length} members` : 'Direct message'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleForward}
            disabled={selectedChats.length === 0}
          >
            Forward to {selectedChats.length} chat{selectedChats.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
