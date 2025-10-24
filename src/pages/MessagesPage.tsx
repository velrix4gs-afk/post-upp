import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useFollowers } from '@/hooks/useFollowers';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import Navigation from '@/components/Navigation';
import { MessageBubble } from '@/components/MessageBubble';
import VoiceRecorder from '@/components/VoiceRecorder';
import { NewChatDialog } from '@/components/NewChatDialog';
import TypingIndicator from '@/components/TypingIndicator';
import { StarredMessagesDialog } from '@/components/messaging/StarredMessagesDialog';
import { ForwardMessageDialog } from '@/components/messaging/ForwardMessageDialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, Smile, Search, Plus, MoreVertical, Phone, Video, Image as ImageIcon, Mic, X, MessageCircle, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  const { 
    chats, 
    messages, 
    loading, 
    sendMessage, 
    editMessage, 
    deleteMessage, 
    reactToMessage,
    unreactToMessage,
    starMessage,
    unstarMessage,
    forwardMessage,
    markMessageRead,
    refetchChats, 
    refetchMessages 
  } = useMessages(selectedChatId || undefined);
  const { createChat: createChatByUuid } = useChats();
  const { following } = useFollowers();
  const { handleTyping } = useTypingIndicator(selectedChatId || undefined);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatSearch, setNewChatSearch] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showStarredDialog, setShowStarredDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      refetchChats();
    }
  }, [user, refetchChats]);

  // Handle chat_id from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatIdFromUrl = params.get('chat');
    if (chatIdFromUrl) {
      setSelectedChatId(chatIdFromUrl);
    }
  }, []);

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

  const handleForwardMessage = async (chatIds: string[]) => {
    if (forwardingMessageId) {
      await forwardMessage(forwardingMessageId, chatIds);
      setForwardingMessageId(null);
    }
  };

  const handleCreateNewChat = async (friendId: string) => {
    try {
      console.log('[MessagesPage] Creating chat with friend UUID:', friendId);
      
      // Validate UUID format before calling
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(friendId)) {
        throw new Error('CHAT_002: Invalid user ID format');
      }
      
      const chatId = await createChatByUuid(friendId);
      console.log('[MessagesPage] Chat created with ID:', chatId);
      
      if (chatId) {
        setSelectedChatId(chatId);
        setSearchQuery('');
        setShowNewChatDialog(false);
        await refetchChats();
      } else {
        throw new Error('CHAT_005: Failed to create chat - no ID returned');
      }
    } catch (error: any) {
      console.error('[MessagesPage] Create new chat error:', error);
      // Error already shown by useChats, just re-throw
      throw error;
    }
  };

  const selectedChat = chats.find(c => c.id === selectedChatId);
  
  // Filter chats by name or participant
  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => 
      p.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Filter messages by content when in a chat
  const filteredMessages = selectedChatId && searchQuery.trim() 
    ? messages.filter(msg => 
        msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-0 md:px-4 h-[calc(100dvh-80px)]">
        <Card className="h-full flex flex-col md:flex-row overflow-hidden rounded-none md:rounded-lg border-x-0 md:border-x bg-gradient-to-br from-background via-background to-primary/5">
          {/* Chat List Sidebar */}
          <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 md:border-r border-primary/10 flex-col bg-gradient-to-b from-card/50 to-background`}>
            <div className="p-3 md:p-4 border-b border-primary/10 space-y-3 bg-gradient-subtle backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Messages</h2>
                <Button 
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowNewChatDialog(true)}
                  className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={selectedChatId ? "Search in conversation..." : "Search messages..."}
                  className="pl-9 bg-background/50 border-primary/20 focus:border-primary transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {/* Search in Following */}
                {!selectedChatId && (
                  <div className="mb-4">
                    <Input
                      placeholder="Search friends to message..."
                      value={newChatSearch}
                      onChange={(e) => setNewChatSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                )}

                {/* Following Section */}
                {!selectedChatId && following.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase px-3 mb-2">
                      Following ({following.filter(f => 
                        !newChatSearch || 
                        f.following?.display_name?.toLowerCase().includes(newChatSearch.toLowerCase()) ||
                        f.following?.username?.toLowerCase().includes(newChatSearch.toLowerCase())
                      ).length})
                    </h3>
                    <div className="space-y-1">
                      {following
                        .filter(f => 
                          !newChatSearch || 
                          f.following?.display_name?.toLowerCase().includes(newChatSearch.toLowerCase()) ||
                          f.following?.username?.toLowerCase().includes(newChatSearch.toLowerCase())
                        )
                        .slice(0, 10).map((follow) => (
                        <div
                          key={follow.id}
                          className="p-2 rounded-lg cursor-pointer hover:bg-primary/10 transition-all duration-200 group border border-transparent hover:border-primary/20"
                          onClick={() => handleCreateNewChat(follow.following?.id || follow.following_id)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-10 w-10 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                              <AvatarImage src={follow.following?.avatar_url} />
                              <AvatarFallback className="bg-gradient-primary text-white">
                                {follow.following?.display_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {follow.following?.display_name || 'User'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{follow.following?.username || 'username'}
                              </p>
                            </div>
                            <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Separator className="my-4" />
                  </div>
                )}

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
                ) : filteredChats.length === 0 && searchQuery ? (
                  <div className="text-center py-8 px-4 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No results found</p>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center py-12 px-4 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">No conversations yet</p>
                    <p className="text-sm">Click on a friend above to start messaging</p>
                  </div>
                ) : (
                  filteredChats.map(chat => {
                    const otherParticipant = chat.participants.find(p => p.user_id !== user?.id);
                    const chatName = chat.name || otherParticipant?.profiles.display_name || 'Unknown';
                    const avatar = chat.avatar_url || otherParticipant?.profiles.avatar_url;

                    return (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group border ${
                          selectedChatId === chat.id 
                            ? 'bg-gradient-primary/10 border-primary/30 shadow-md' 
                            : 'hover:bg-primary/5 border-transparent hover:border-primary/10'
                        }`}
                        onClick={() => setSelectedChatId(chat.id)}
                      >
                        <div className="flex gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className={`h-12 w-12 ring-2 transition-all ${
                              selectedChatId === chat.id ? 'ring-primary/50' : 'ring-transparent group-hover:ring-primary/20'
                            }`}>
                              <AvatarImage src={avatar} />
                              <AvatarFallback className={selectedChatId === chat.id ? "bg-gradient-primary text-white" : "bg-muted"}>{chatName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 h-3 w-3 bg-success rounded-full border-2 border-background" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`font-medium truncate text-sm md:text-base transition-colors ${
                                selectedChatId === chat.id ? 'text-primary' : 'group-hover:text-primary'
                              }`}>{chatName}</p>
                            </div>
                            <p className="text-xs md:text-sm text-muted-foreground truncate">
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

          {/* NewChatDialog is rendered at bottom of component */}

          {/* Chat Area */}
          <div className={`${selectedChatId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gradient-to-br from-background to-primary/5`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-3 md:p-4 border-b border-primary/10 flex items-center justify-between bg-gradient-subtle backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="md:hidden flex-shrink-0 h-10 w-10 hover:bg-primary/10"
                      onClick={() => setSelectedChatId(null)}
                    >
                      ←
                    </Button>
                    {(() => {
                      const otherParticipant = selectedChat.participants.find(p => p.user_id !== user?.id);
                      const chatName = selectedChat.name || otherParticipant?.profiles.display_name || 'User';
                      const chatAvatar = selectedChat.avatar_url || otherParticipant?.profiles.avatar_url;
                      
                      return (
                        <>
                          <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/30">
                            <AvatarImage src={chatAvatar} />
                            <AvatarFallback className="bg-gradient-primary text-white">{chatName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{chatName}</p>
                            <p className="text-xs md:text-sm text-success">Online</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex gap-1 md:gap-2 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-primary/10 hover:text-primary" disabled>
                      <Phone className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-10 w-10 hidden md:flex hover:bg-primary/10 hover:text-primary" disabled>
                      <Video className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 hover:bg-primary/10 hover:text-primary"
                      onClick={() => setShowStarredDialog(true)}
                    >
                      <Star className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-10 w-10 hover:bg-primary/10 hover:text-primary">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-2 py-3 md:px-4 md:py-4 bg-muted/20">
                  <div className="space-y-0.5 md:space-y-1">
                    {searchQuery.trim() && filteredMessages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium mb-2">No messages found</p>
                        <p className="text-sm">Try a different search term</p>
                      </div>
                    ) : (
                      filteredMessages.map((message) => {
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
                            status={message.status}
                            isForwarded={message.is_forwarded}
                            onEdit={isOwn ? handleEditMessage : undefined}
                            onDelete={isOwn ? (id) => setDeletingMessageId(id) : undefined}
                            onReply={() => setReplyingTo(message)}
                            onReact={reactToMessage}
                            onUnreact={unreactToMessage}
                            onStar={starMessage}
                            onUnstar={unstarMessage}
                            onForward={(id) => {
                              setForwardingMessageId(id);
                              setShowForwardDialog(true);
                            }}
                          />
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Typing Indicator */}
                  {selectedChatId && <TypingIndicator chatId={selectedChatId} />}
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
                  <div className="p-4 border-t">
                    <VoiceRecorder
                      onSend={handleVoiceSend}
                      onCancel={() => setIsRecordingVoice(false)}
                    />
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="p-3 md:p-4 border-t border-primary/10 bg-gradient-subtle backdrop-blur-sm">
                    <div className="flex gap-1.5 md:gap-2 items-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        size="icon"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 w-10 flex-shrink-0 hover:bg-primary/10 hover:text-primary"
                      >
                        <ImageIcon className="h-5 w-5" />
                      </Button>
                      <Button 
                        type="button" 
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsRecordingVoice(true)}
                        className="h-10 w-10 flex-shrink-0 hidden md:flex hover:bg-primary/10 hover:text-primary"
                      >
                        <Mic className="h-5 w-5" />
                      </Button>
                      <Input
                        placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
                        value={messageText}
                        onChange={(e) => {
                          setMessageText(e.target.value);
                          handleTyping();
                        }}
                        className="flex-1 h-10 text-base bg-background/50 border-primary/20 focus:border-primary transition-colors"
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
                          className="h-10 flex-shrink-0"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="ghost"
                        className="h-10 w-10 flex-shrink-0 hidden md:flex"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                      <Button 
                        type="submit" 
                        size="icon"
                        disabled={!messageText.trim() && !selectedImage}
                        className="h-10 w-10 flex-shrink-0 bg-gradient-primary hover:shadow-glow transition-all duration-300"
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center max-w-md px-6 space-y-4 animate-fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
                    <MessageCircle className="h-20 w-20 mx-auto text-primary relative z-10" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground bg-gradient-primary bg-clip-text text-transparent">Your Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Send private messages to friends and connect with others in your network
                  </p>
                  <Button 
                    onClick={() => setShowNewChatDialog(true)}
                    className="mt-4 bg-gradient-primary hover:shadow-glow transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <NewChatDialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        onSelectFriend={handleCreateNewChat}
      />

      <StarredMessagesDialog
        open={showStarredDialog}
        onClose={() => setShowStarredDialog(false)}
        chatId={selectedChatId || undefined}
      />

      <ForwardMessageDialog
        open={showForwardDialog}
        onClose={() => {
          setShowForwardDialog(false);
          setForwardingMessageId(null);
        }}
        onForward={handleForwardMessage}
        chats={chats}
        currentChatId={selectedChatId || undefined}
      />

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
