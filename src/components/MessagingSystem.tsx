import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft,
  Smile,
  Paperclip,
  Mic
} from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresenceSystem } from '@/hooks/usePresenceSystem';
import { useChatSettings } from '@/hooks/useChatSettings';
import { ChatMenu } from './ChatMenu';
import { BlockUserDialog } from './messaging/BlockUserDialog';
import { SearchInChatDialog } from './messaging/SearchInChatDialog';
import { ClearChatDialog } from './messaging/ClearChatDialog';
import { ReportUserDialog } from './messaging/ReportUserDialog';
import { SharedMediaGallery } from './messaging/SharedMediaGallery';
import { StarredMessagesDialog } from './messaging/StarredMessagesDialog';
import { WallpaperDialog } from './messaging/WallpaperDialog';
import { FileUploadDialog } from './messaging/FileUploadDialog';
import { EnhancedMessageBubble } from './EnhancedMessageBubble';
import { ForwardMessageDialog } from './messaging/ForwardMessageDialog';
import { ScheduleMessageDialog } from './messaging/ScheduleMessageDialog';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import TypingIndicator from './TypingIndicator';
import VoiceRecorder from './VoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const MessagingSystem = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showStarredDialog, setShowStarredDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showWallpaperDialog, setShowWallpaperDialog] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);
  
  const { 
    messages, 
    chats, 
    chatsLoading,
    messagesLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    unreactToMessage,
    starMessage,
    unstarMessage,
    forwardMessage,
    markMessageRead
  } = useMessages(selectedChatId || undefined);
  
  const { createChat: createChatByUuid } = useChats();
  const { settings } = useChatSettings(selectedChatId || undefined);

  const { handleTyping } = useTypingIndicator(selectedChatId || undefined);
  const { isUserOnline, updateCurrentChat } = usePresenceSystem(selectedChatId || undefined);

  // Update viewing chat when selected chat changes
  useEffect(() => {
    updateCurrentChat(selectedChatId || undefined);
    setHasScrolledToUnread(false);
  }, [selectedChatId]);

  // Mark messages as read and show notification for new messages
  useEffect(() => {
    if (selectedChatId && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.sender_id !== user?.id && m.status !== 'read');
      
      // Mark as read
      unreadMessages.forEach(msg => {
        markMessageRead(msg.id);
      });
      
      // Show notification for new messages when chat is not selected
      if (!document.hasFocus()) {
        const latestMessage = messages[messages.length - 1];
        if (latestMessage && latestMessage.sender_id !== user?.id) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(latestMessage.sender.display_name, {
              body: latestMessage.content || 'Sent a media file',
              icon: latestMessage.sender.avatar_url
            });
          }
        }
      }
    }
  }, [selectedChatId, messages]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Auto-scroll to first unread message or bottom
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledToUnread) {
      const firstUnread = messages.find(m => m.sender_id !== user?.id && m.status !== 'read');
      
      if (firstUnread) {
        const element = document.getElementById(`message-${firstUnread.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setHasScrolledToUnread(true);
          return;
        }
      }
      
      scrollToBottom();
      setHasScrolledToUnread(true);
    }
  }, [messages, hasScrolledToUnread]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0 && hasScrolledToUnread) {
      scrollToBottom();
    }
  }, [messages.length]);

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // For private chats, search by other user's name
    if (!chat.is_group) {
      const otherParticipant = chat.participants.find(p => p.user_id !== user?.id);
      const name = otherParticipant?.profiles?.display_name || '';
      const username = otherParticipant?.profiles?.username || '';
      return name.toLowerCase().includes(searchLower) || 
             username.toLowerCase().includes(searchLower);
    }
    
    // For group chats, search by chat name
    return chat.name?.toLowerCase().includes(searchLower) || false;
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId) return;
    
    if (editingMessage) {
      await editMessage(editingMessage.id, newMessage);
      setEditingMessage(null);
    } else {
      await sendMessage(newMessage, replyToMessage?.id);
      setReplyToMessage(null);
    }
    setNewMessage('');
  };

  const handleEditMessage = (id: string, content: string) => {
    setEditingMessage({ id, content });
    setNewMessage(content);
  };

  const handleReply = (message: any) => {
    setReplyToMessage(message);
  };

  const handleForward = (messageId: string) => {
    setForwardingMessageId(messageId);
    setShowForwardDialog(true);
  };

  const handleForwardSubmit = async (chatIds: string[]) => {
    if (forwardingMessageId) {
      await forwardMessage(forwardingMessageId, chatIds);
      setShowForwardDialog(false);
      setForwardingMessageId(null);
      toast({
        title: 'Success',
        description: 'Message forwarded successfully',
      });
    }
  };

  const handleFileUploadComplete = async (url: string, type: string, fileName: string) => {
    if (!selectedChatId) return;
    
    // Determine media type category
    let mediaType = type;
    if (type.startsWith('image/')) mediaType = 'image';
    else if (type.startsWith('video/')) mediaType = 'video';
    else if (type.startsWith('audio/')) mediaType = 'audio';
    else mediaType = 'document';
    
    await sendMessage(fileName, undefined, url, mediaType);
  };

  const handleVoiceNote = async (audioBlob: Blob, duration: number) => {
    if (!selectedChatId || !user) return;

    try {
      // Upload voice note to storage
      const fileName = `${user.id}/${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('messages')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(fileName);

      await sendMessage('', undefined, publicUrl, 'audio');
      setShowVoiceRecorder(false);
    } catch (error) {
      console.error('Error sending voice note:', error);
      toast({
        title: 'Error',
        description: 'Failed to send voice note',
        variant: 'destructive'
      });
    }
  };

  const handleStartNewChat = async (friendId: string) => {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(friendId)) {
      console.error('[MessagingSystem] Invalid UUID:', friendId);
      toast({
        title: 'Error',
        description: 'Invalid user ID format',
        variant: 'destructive'
      });
      return;
    }
    
    const chatId = await createChatByUuid(friendId);
    if (chatId) {
      setSelectedChatId(chatId);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getOtherParticipants = (chat: any) => {
    return chat.participants.filter((p: any) => p.user_id !== user?.id);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-[800px] bg-background">
      {/* Chat List Sidebar */}
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 md:border-r`}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">Messages</h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* New Chat with Friends */}
          {friends.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2 text-muted-foreground">Start new chat</h3>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {friends.slice(0, 5).map((friend) => (
                  <Button
                    key={friend.id}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 flex flex-col items-center p-2 h-auto"
                    onClick={() => handleStartNewChat(friend.id)}
                  >
                    <Avatar className="h-8 w-8 mb-1">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {friend.display_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs truncate max-w-[60px]">
                      {friend.display_name.split(' ')[0]}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {chats.length === 0 ? 'No conversations yet' : 'No matching conversations'}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredChats.map((chat) => {
                const lastMessage = messages.find(m => m.chat_id === chat.id);
                const otherParticipants = getOtherParticipants(chat);
                const chatName = chat.name || otherParticipants.map(p => p.profiles.display_name).join(', ');
                const chatAvatar = chat.avatar_url || otherParticipants[0]?.profiles.avatar_url;

                return (
                  <Button
                    key={chat.id}
                    variant={selectedChatId === chat.id ? "secondary" : "ghost"}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={chatAvatar} />
                        <AvatarFallback>
                          {chatName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-medium truncate">{chatName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {lastMessage && formatMessageTime(lastMessage.created_at)}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedChatId ? (
        <div className="flex flex-col flex-1">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedChatId(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {selectedChat && (
                <>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={
                      selectedChat.avatar_url || 
                      getOtherParticipants(selectedChat)[0]?.profiles.avatar_url
                    } />
                    <AvatarFallback>
                      {(selectedChat.name || 
                        getOtherParticipants(selectedChat).map(p => p.profiles.display_name).join(', ')
                      ).split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button
                      variant="ghost"
                      className="p-0 h-auto hover:bg-transparent"
                      onClick={() => {
                        const otherUser = getOtherParticipants(selectedChat)[0];
                        if (otherUser) {
                          window.location.href = `/profile/${otherUser.profiles.username}`;
                        }
                      }}
                    >
                      <h3 className="font-semibold hover:text-primary transition-colors">
                        {selectedChat.name || 
                         getOtherParticipants(selectedChat).map(p => p.profiles.display_name).join(', ')}
                      </h3>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      {getOtherParticipants(selectedChat).length === 1 ? (
                        isUserOnline(getOtherParticipants(selectedChat)[0].user_id) 
                          ? 'Online' 
                          : 'Offline'
                      ) : `${selectedChat.participants.length} members`}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              {selectedChat && (
                <ChatMenu 
                  chatId={selectedChat.id}
                  otherUserId={getOtherParticipants(selectedChat)[0]?.user_id}
                  otherUsername={getOtherParticipants(selectedChat)[0]?.profiles.username}
                  onBlock={() => setShowBlockDialog(true)}
                  onReport={() => setShowReportDialog(true)}
                  onClearChat={() => setShowClearDialog(true)}
                  onViewMedia={() => setShowMediaGallery(true)}
                  onSearchInChat={() => setShowSearchDialog(true)}
                  onViewStarred={() => setShowStarredDialog(true)}
                  onWallpaperChange={() => setShowWallpaperDialog(true)}
                />
              )}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea 
            className="flex-1 p-4"
            style={{
              backgroundImage: settings?.wallpaper_url && settings.wallpaper_url.startsWith('http') 
                ? `url(${settings.wallpaper_url})` 
                : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div 
              className={`space-y-1 ${settings?.wallpaper_url && !settings.wallpaper_url.startsWith('http') 
                ? getWallpaperClass(settings.wallpaper_url) 
                : ''}`}
            >
              {messages
                .filter((message, index, self) => 
                  // Remove duplicates by ID
                  index === self.findIndex(m => m.id === message.id)
                )
                .map((message) => {
                const isOwn = message.sender_id === user?.id;
                
                return (
                  <div key={message.id} id={`message-${message.id}`}>
                    <EnhancedMessageBubble
                      id={message.id}
                      content={message.content || ''}
                      sender={message.sender}
                      timestamp={message.created_at}
                      isOwn={isOwn}
                      mediaUrl={message.media_url}
                      mediaType={message.media_type}
                      isEdited={message.is_edited}
                      isForwarded={message.is_forwarded}
                      status={message.status}
                      onEdit={handleEditMessage}
                      onDelete={(id, deleteFor) => deleteMessage(id, deleteFor)}
                      onReply={() => handleReply(message)}
                      onReact={reactToMessage}
                      onUnreact={unreactToMessage}
                      onStar={starMessage}
                      onUnstar={unstarMessage}
                      onForward={handleForward}
                      onSchedule={() => setShowScheduleDialog(true)}
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Typing Indicator */}
            {selectedChatId && <TypingIndicator chatId={selectedChatId} />}
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            {/* Reply/Edit indicator */}
            {(replyToMessage || editingMessage) && (
              <div className="mb-2 p-2 bg-muted rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    {editingMessage ? 'Editing message' : `Replying to ${replyToMessage?.sender.display_name}`}
                  </p>
                  <p className="text-sm truncate">
                    {editingMessage ? editingMessage.content : replyToMessage?.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyToMessage(null);
                    setEditingMessage(null);
                    setNewMessage('');
                  }}
                >
                  ✕
                </Button>
              </div>
            )}
            
            {showVoiceRecorder ? (
              <div className="flex items-center justify-center py-4">
                <VoiceRecorder
                  onSend={handleVoiceNote}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2 w-full">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => setShowFileUpload(true)}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="hidden sm:flex flex-shrink-0">
                  <Smile className="h-4 w-4" />
                </Button>
                <Input
                  placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1 min-w-0"
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => setShowVoiceRecorder(true)}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  className="flex-shrink-0"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="bg-muted rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
              <Send className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
            <p className="text-muted-foreground">
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        </div>
      )}
      
      {/* Dialogs */}
      {selectedChat && (
        <>
          <BlockUserDialog
            userId={getOtherParticipants(selectedChat)[0]?.user_id || ''}
            userName={getOtherParticipants(selectedChat)[0]?.profiles.display_name || 'User'}
            open={showBlockDialog}
            onOpenChange={setShowBlockDialog}
          />
          <SearchInChatDialog
            chatId={selectedChat.id}
            open={showSearchDialog}
            onOpenChange={setShowSearchDialog}
            onMessageSelect={(id) => console.log('Jump to message:', id)}
          />
          <ClearChatDialog
            chatId={selectedChat.id}
            open={showClearDialog}
            onOpenChange={setShowClearDialog}
            onCleared={() => window.location.reload()}
          />
          <ReportUserDialog
            userId={getOtherParticipants(selectedChat)[0]?.user_id || ''}
            userName={getOtherParticipants(selectedChat)[0]?.profiles.display_name || 'User'}
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
          />
          <SharedMediaGallery
            chatId={selectedChat.id}
            open={showMediaGallery}
            onOpenChange={setShowMediaGallery}
          />
          <StarredMessagesDialog
            open={showStarredDialog}
            onClose={() => setShowStarredDialog(false)}
            chatId={selectedChat.id}
          />
          {showForwardDialog && (
            <ForwardMessageDialog
              open={showForwardDialog}
              onClose={() => setShowForwardDialog(false)}
              chats={chats}
              currentChatId={selectedChat.id}
              onForward={handleForwardSubmit}
            />
          )}
          {showWallpaperDialog && (
            <WallpaperDialog
              chatId={selectedChat.id}
              open={showWallpaperDialog}
              onOpenChange={setShowWallpaperDialog}
            />
          )}
          {showFileUpload && (
            <FileUploadDialog
              chatId={selectedChat.id}
              open={showFileUpload}
              onOpenChange={setShowFileUpload}
              onUploadComplete={handleFileUploadComplete}
            />
          )}
          {showScheduleDialog && (
            <ScheduleMessageDialog
              chatId={selectedChat.id}
              content=""
              open={showScheduleDialog}
              onOpenChange={setShowScheduleDialog}
              onScheduled={() => {
                setShowScheduleDialog(false);
                toast({ title: 'Message scheduled successfully' });
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

const getWallpaperClass = (wallpaperId: string) => {
  const wallpapers: Record<string, string> = {
    'blue': 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950 dark:to-blue-900',
    'green': 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-950 dark:to-green-900',
    'purple': 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950 dark:to-purple-900',
    'pink': 'bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-950 dark:to-pink-900',
    'orange': 'bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-950 dark:to-orange-900',
  };
  return wallpapers[wallpaperId] || '';
};

export default MessagingSystem;