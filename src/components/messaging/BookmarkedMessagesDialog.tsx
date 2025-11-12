import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BookmarkedMessage {
  id: string;
  message_id: string;
  created_at: string;
  message: {
    id: string;
    content: string;
    created_at: string;
    media_url?: string;
    media_type?: string;
    sender: {
      display_name: string;
      avatar_url?: string;
    };
  };
}

interface BookmarkedMessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId?: string;
}

const BookmarkedMessagesDialog = ({ open, onOpenChange, chatId }: BookmarkedMessagesDialogProps) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open && user) {
      fetchBookmarks();
    }
  }, [open, user, chatId]);

  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('message_bookmarks')
        .select(`
          id,
          message_id,
          created_at,
          message:messages(
            id,
            content,
            created_at,
            media_url,
            media_type,
            sender:profiles!messages_sender_id_fkey(
              display_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Filter by chat if specified
      if (chatId) {
        query = query.eq('messages.chat_id', chatId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setBookmarks(data as any || []);
    } catch (error: any) {
      console.error('Error fetching bookmarks:', error);
      toast({
        title: 'Failed to load bookmarks',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('message_bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      
      toast({
        title: 'Bookmark removed',
        description: 'Message removed from bookmarks'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to remove bookmark',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.message?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Bookmarked Messages
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Bookmarks List */}
          <ScrollArea className="h-96">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading bookmarks...
              </div>
            ) : filteredBookmarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No bookmarks yet</p>
                <p className="text-sm">
                  {searchQuery ? 'No bookmarks match your search' : 'Long press a message to bookmark it'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map(bookmark => (
                  <div
                    key={bookmark.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {bookmark.message?.sender?.display_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(bookmark.message?.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>

                        <p className="text-sm">{bookmark.message?.content}</p>

                        {bookmark.message?.media_url && (
                          <div className="mt-2">
                            {bookmark.message.media_type?.startsWith('image') ? (
                              <img
                                src={bookmark.message.media_url}
                                alt="Media"
                                className="max-w-xs rounded"
                              />
                            ) : bookmark.message.media_type?.startsWith('video') ? (
                              <video
                                src={bookmark.message.media_url}
                                className="max-w-xs rounded"
                                controls
                              />
                            ) : null}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground">
                          Bookmarked {format(new Date(bookmark.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeBookmark(bookmark.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookmarkedMessagesDialog;