import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from '@/components/MessageBubble';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Message } from '@/hooks/useMessages';
import { Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface StarredMessagesDialogProps {
  open: boolean;
  onClose: () => void;
  chatId?: string;
}

export const StarredMessagesDialog = ({ open, onClose, chatId }: StarredMessagesDialogProps) => {
  const { user } = useAuth();
  const [starredMessages, setStarredMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchStarredMessages();
    }
  }, [open, user, chatId]);

  const fetchStarredMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('messages', {
        body: { 
          action: 'get_starred',
          chat_id: chatId 
        },
      });

      if (error) throw error;
      setStarredMessages(data || []);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to load starred messages',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnstar = async (messageId: string) => {
    try {
      const { error } = await supabase.functions.invoke('messages', {
        body: { action: 'unstar', messageId },
      });

      if (error) throw error;
      
      setStarredMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: 'Success',
        description: 'Message unstarred'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to unstar message',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            Starred Messages
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : starredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium mb-2">No starred messages</p>
              <p className="text-sm">Star important messages to find them easily later</p>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {starredMessages.map((message) => (
                <div key={message.id} className="border-b pb-4 last:border-0">
                  <MessageBubble
                    id={message.id}
                    content={message.content || ''}
                    sender={message.sender}
                    timestamp={message.created_at}
                    isOwn={message.sender_id === user?.id}
                    mediaUrl={message.media_url}
                    mediaType={message.media_type}
                    isEdited={message.is_edited}
                    onDelete={handleUnstar}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
