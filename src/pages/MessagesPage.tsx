import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useFollowers } from '@/hooks/useFollowers';
import Navigation from '@/components/Navigation';
import { MessageBubble } from '@/components/MessageBubble';
import VoiceRecorder from '@/components/VoiceRecorder';
import { NewChatDialog } from '@/components/NewChatDialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Smile, Search, Plus, MoreVertical, Phone, Video, Image as ImageIcon, Mic, X, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const MessagesPage = () => {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { chats, messages, loading, sendMessage, editMessage, deleteMessage, createChat, refetchChats, refetchMessages } = useMessages(selectedChatId || undefined);
  const { following } = useFollowers();
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      refetchChats();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!messageText.trim() && !selectedImage) || !selectedChatId) return;

    try {
      // Handle edit
      if (editingMessageId) {
        await editMessage(editingMessageId, messageText);
        setEditingMessageId(null);
        setMessageText('');
        return;
      }

      // Handle new message
      let mediaUrl = null;
      let mediaType = null;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('messages')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('messages')
          .getPublicUrl(fileName);

        mediaUrl = publicUrl;
        mediaType = `image/${fileExt}`;
      }

      await sendMessage(
        messageText.trim() || '📷 Photo',
        replyingTo?.id,
        mediaUrl || undefined,
        mediaType || undefined
      );

      setMessageText('');
      setSelectedImage(null);
      setImagePreview(null);
      setReplyingTo(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const handleEditMessage = (id: string, content: string) => {
    setEditingMessageId(id);
    setMessageText(content);
  };

  const handleDeleteMessage = async () => {
    if (deletingMessageId) {
      await deleteMessage(deletingMessageId);
      setDeletingMessageId(null);
    }
  };

  const handleVoiceSend = async (audioBlob: Blob, duration: number) => {
    if (!selectedChatId) return;

    try {
      const fileName = `${user?.id}/${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('messages')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(fileName);

      await sendMessage('🎤 Voice message', undefined, publicUrl, 'audio/webm');

      setIsRecordingVoice(false);
      toast({
        title: 'Success',
        description: 'Voice message sent'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send voice message',
        variant: 'destructive'
      });
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    // TODO: Implement when types are updated
    console.log('React with:', emoji, 'to message:', messageId);
  };

  const handleCreateNewChat = async (friendId: string) => {
    try {
      const chatId = await createChat([friendId], false);
      if (chatId) {
        setSelectedChatId(chatId);
        setShowNewChatDialog(false);
        await refetchChats();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create chat',
        variant: 'destructive'
      });
    }
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => 
      p.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container-mobile md:container-desktop mx-auto p-2 md:p-4 h-[calc(100vh-80px)]">
        <Card className="h-full flex flex-col md:flex-row">
          {/* Chat List Sidebar */}
          <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 md:border-r flex-col`}>
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Messages</h2>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setShowNewChatDialog(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-3 rounded animate-pulse">
                        <div className="flex gap-3">
                          <div className="h-12 w-12 rounded-full bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-12 px-4 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">No conversations yet</p>
                    <p className="text-sm">Visit a friend's profile to start messaging</p>
                  </div>
                ) : (
                  filteredChats.map(chat => {
                    const otherParticipant = chat.participants.find(p => p.user_id !== user?.id);
                    const chatName = chat.name || otherParticipant?.profiles.display_name || 'Unknown';
                    const avatar = chat.avatar_url || otherParticipant?.profiles.avatar_url;

                    return (
                      <div
                        key={chat.id}
                        className={`p-3 rounded cursor-pointer hover:bg-muted transition-colors ${
                          selectedChatId === chat.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedChatId(chat.id)}
                      >
                        <div className="flex gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarImage src={avatar} />
                              <AvatarFallback>{chatName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">{chatName}</p>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {chat.is_group ? `${chat.participants.length} members` : 'Direct message'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* New Chat Dialog */}
          <NewChatDialog
            open={showNewChatDialog}
            onClose={() => setShowNewChatDialog(false)}
            onSelectFriend={handleCreateNewChat}
          />

          {/* Chat Area */}
          <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="md:hidden"
                      onClick={() => setSelectedChatId(null)}
                    >
                      ←
                    </Button>
                    <Avatar>
                      <AvatarImage src={selectedChat.avatar_url} />
                      <AvatarFallback>{selectedChat.name?.[0] || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedChat.name || 'Chat'}</p>
                      <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-muted/20">
                  <div className="space-y-1">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === user?.id;
                      const senderProfile = selectedChat.participants.find(p => p.user_id === message.sender_id)?.profiles;
                      
                      return (
                        <MessageBubble
                          key={message.id}
                          id={message.id}
                          content={message.content || ''}
                          sender={{
                            username: senderProfile?.username || '',
                            display_name: senderProfile?.display_name || 'Unknown',
                            avatar_url: senderProfile?.avatar_url
                          }}
                          timestamp={message.created_at}
                          isOwn={isOwn}
                          mediaUrl={message.media_url}
                          mediaType={message.media_type}
                          isEdited={message.is_edited}
                          onEdit={isOwn ? handleEditMessage : undefined}
                          onDelete={isOwn ? (id) => setDeletingMessageId(id) : undefined}
                          onReply={() => setReplyingTo(message)}
                        />
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Replying to</p>
                      <p className="text-sm truncate">{replyingTo.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Image Preview */}
                {imagePreview && (
                  <div className="px-4 py-2 bg-muted/50 border-t">
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Preview" className="h-20 rounded" />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Voice Recorder */}
                {isRecordingVoice ? (
                  <VoiceRecorder
                    onSend={handleVoiceSend}
                    onCancel={() => setIsRecordingVoice(false)}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2 items-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setIsRecordingVoice(true)}
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      <Input
                        placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      {editingMessageId && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingMessageId(null);
                            setMessageText('');
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button type="button" size="sm" variant="ghost">
                        <Smile className="h-5 w-5" />
                      </Button>
                      <Button type="submit" size="sm" disabled={!messageText.trim() && !selectedImage}>
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center max-w-md px-6">
                  <MessageCircle className="h-20 w-20 mx-auto mb-6 opacity-20" />
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Your Messages</h3>
                  <p className="text-sm mb-4">
                    Send private messages to friends and connect with others in your network
                  </p>
                  <p className="text-xs">
                    Select a conversation from the list or visit a profile to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Search followers..." />
            <ScrollArea className="h-64">
              {following.map((follower) => (
                <div
                  key={follower.following.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => handleCreateNewChat(follower.following.id)}
                >
                  <Avatar>
                    <AvatarImage src={follower.following.avatar_url} />
                    <AvatarFallback>
                      {follower.following.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{follower.following.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      @{follower.following.username}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMessageId} onOpenChange={() => setDeletingMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessagesPage;
