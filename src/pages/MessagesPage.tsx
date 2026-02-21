import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useChats } from '@/hooks/useChats';
import { useFriends } from '@/hooks/useFriends';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePresence } from '@/hooks/usePresence';
import { useLastSeen } from '@/hooks/useLastSeen';
import { useScreenshotDetection } from '@/hooks/useScreenshotDetection';
import { useChatSettings } from '@/hooks/useChatSettings';
import { useAdmin } from '@/hooks/useAdmin';
import Navigation from '@/components/Navigation';
import { BackNavigation } from '@/components/BackNavigation';
import { VideoCall } from '@/components/VideoCall';
import { VoiceCall } from '@/components/VoiceCall';
import { ChatSettingsDialog } from '@/components/messaging/ChatSettingsDialog';
import { EnhancedMessageBubble } from '@/components/EnhancedMessageBubble';
import { MessagingMenu } from '@/components/MessagingMenu';
import VoiceRecorder from '@/components/VoiceRecorder';
import { NewChatDialog } from '@/components/NewChatDialog';
import { GroupChatDialog } from '@/components/messaging/GroupChatDialog';
import TypingIndicator from '@/components/TypingIndicator';
import { StarredMessagesDialog } from '@/components/messaging/StarredMessagesDialog';
import { ForwardMessageDialog } from '@/components/messaging/ForwardMessageDialog';
import { SearchInChatDialog } from '@/components/messaging/SearchInChatDialog';
import { ChatMediaTab } from '@/components/messaging/ChatMediaTab';
import { GroupInfoDialog } from '@/components/messaging/GroupInfoDialog';
import { WallpaperDialog } from '@/components/messaging/WallpaperDialog';
import { ClearChatDialog } from '@/components/messaging/ClearChatDialog';
import { BlockUserDialog } from '@/components/messaging/BlockUserDialog';
import { ReportUserDialog } from '@/components/messaging/ReportUserDialog';
import { AIAssistantChat } from '@/components/AIAssistantChat';

import { LocationShareDialog } from '@/components/messaging/LocationShareDialog';
import { ContactShareDialog } from '@/components/messaging/ContactShareDialog';
import { EncryptionBadge } from '@/components/messaging/EncryptionBadge';
import { FileUpload } from '@/components/messaging/FileUpload';
import { ChatMenu } from '@/components/ChatMenu';
import { DisappearingMessagesDialog } from '@/components/messaging/DisappearingMessagesDialog';
import { ChatAttachmentsSheet } from '@/components/messaging/ChatAttachmentsSheet';
import { ScheduleMessageDialog } from '@/components/messaging/ScheduleMessageDialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Send, Paperclip, Smile, Search, Plus, MoreVertical, Phone, Video, Image as ImageIcon, Mic, X, MessageCircle, Star, MapPin, Users as UsersIcon, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ReactionPicker } from '@/components/ReactionPicker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const MessagesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const {
    chats,
    messages,
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
    markMessageRead,
    refetchChats,
    refetchMessages
  } = useMessages(selectedChatId || undefined);
  const { createChat: createChatByUuid } = useChats();
  const { friends } = useFriends();
  const { handleTyping } = useTypingIndicator(selectedChatId || undefined);
  const { isUserOnline, updateViewingChat } = usePresence(selectedChatId || undefined);
  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const otherParticipant = selectedChat?.participants.find((p) => p.user_id !== user?.id);
  const { formatLastSeen, isOnline } = useLastSeen(otherParticipant?.user_id);

  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newChatSearch, setNewChatSearch] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [showGroupChatDialog, setShowGroupChatDialog] = useState(false);
  const [showStarredDialog, setShowStarredDialog] = useState(false);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showMediaTab, setShowMediaTab] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [showClearChat, setShowClearChat] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showDisappearingDialog, setShowDisappearingDialog] = useState(false);
  const [showAttachmentsSheet, setShowAttachmentsSheet] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null);
  const [isCallInitiator, setIsCallInitiator] = useState(false);
  const { settings: chatSettings } = useChatSettings(selectedChatId || undefined);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unreadMessageRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const [lastReceivedMessage, setLastReceivedMessage] = useState<string>('');

  // Auto-focus input on mount and chat change
  useEffect(() => {
    if (selectedChatId && messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
    }
  }, [selectedChatId]);

  // Track last received message for smart replies
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_id !== user?.id && lastMsg.content) {
        setLastReceivedMessage(lastMsg.content);
      }
    }
  }, [messages, user?.id]);

  useEffect(() => {
    if (user) {
      refetchChats();

      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
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
      // Check file size (max 100MB for videos, 10MB for images)
      const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.type.startsWith('video/') ? 'Videos' : 'Images'} must be less than ${maxSize / (1024 * 1024)}MB`,
          variant: 'destructive'
        });
        return;
      }

      setSelectedImage(file);
      setIsVideo(file.type.startsWith('video/'));
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageText.trim() && !selectedImage || !selectedChatId) return;

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

        const { error: uploadError } = await supabase.storage.
        from('messages').
        upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.
        from('messages').
        getPublicUrl(fileName);

        mediaUrl = publicUrl;
        mediaType = isVideo ? `video/${fileExt}` : `image/${fileExt}`;
      }

      await sendMessage(
        messageText.trim() || (isVideo ? '🎥 Video' : '📷 Photo'),
        replyingTo?.id,
        mediaUrl || undefined,
        mediaType || undefined
      );

      setMessageText('');
      setSelectedImage(null);
      setImagePreview(null);
      setIsVideo(false);
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

      const { error: uploadError } = await supabase.storage.
      from('messages').
      upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.
      from('messages').
      getPublicUrl(fileName);

      await sendMessage('🎤 Voice message', undefined, publicUrl, 'audio/webm');

      setIsRecordingVoice(false);
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
        throw new Error('CHAT_005: An Error occoured try Again');
      }
    } catch (error: any) {
      console.error('[MessagesPage] Create new chat error:', error);
      // Error already shown by useChats, just re-throw
      throw error;
    }
  };

  // Filter chats by name or participant
  const filteredChats = chats.filter((chat) =>
  chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  chat.participants.some((p) =>
  p.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  );

  // Filter messages by content when in a chat
  const filteredMessages = selectedChatId && searchQuery.trim() ?
  messages.filter((msg) =>
  msg.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) :
  messages;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <Navigation />
      <main className="container mx-auto px-0 md:px-4 flex-1 overflow-hidden">
        <Card className="h-full flex flex-col md:flex-row overflow-hidden rounded-none md:rounded-lg border-x-0 md:border-x bg-gradient-to-br from-background via-background to-primary/5">
          {/* Chat List Sidebar */}
          <div className={`${selectedChatId || showAIChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 md:border-r border-primary/10 flex-col bg-gradient-to-b from-card/50 to-background`}>
            <div className="p-3 md:p-4 border-b border-primary/10 space-y-3 bg-gradient-subtle backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.history.length > 1) navigate(-1);else
                      navigate('/feed');
                    }}
                    className="h-8 w-8 md:hidden"
                    aria-label="Go back">

                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg md:text-xl font-bold text-foreground">Messages</h2>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowNewChatDialog(true)}
                    className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    title="New Direct Message">

                    <Plus className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setShowGroupChatDialog(true)}
                    className="h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    title="New Group Chat">

                    <UsersIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={selectedChatId ? "Search in conversation..." : "Search messages..."}
                  className="pl-9 bg-background/50 border-primary/20 focus:border-primary transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} />

              </div>
            </div>

            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                  {/* AI Assistant Chat - Pinned at top */}
                  <div
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group border ${
                  showAIChat ?
                  'bg-gradient-to-r from-primary/20 to-primary/5 border-primary/30 shadow-md' :
                  'hover:bg-primary/5 border-transparent hover:border-primary/10'}`
                  }
                  onClick={() => {
                    setShowAIChat(true);
                    setSelectedChatId(null);
                  }}>

                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 ring-2 transition-all ${
                      showAIChat ? 'ring-primary/50' : 'ring-transparent group-hover:ring-primary/20'}`
                      }>
                          <Sparkles className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-success rounded-full border-2 border-background" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="min-w-0 flex-1">
                            <p className={`font-medium truncate text-sm md:text-base transition-colors ${
                          showAIChat ? 'text-primary' : 'group-hover:text-primary'}`
                          }>
                              {isAdmin ? 'Admin AI Assistant' : 'Post Up AI'}
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                                AI
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {isAdmin ? 'Summarize requests & feedback' : 'Your helpful assistant'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-2 bg-primary/10" />

                    {/* Existing Chats */}
                    {filteredChats.length === 0 && searchQuery ?
                <div className="text-center py-8 px-4 text-muted-foreground">
                        <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No results found</p>
                      </div> :
                filteredChats.length === 0 && !searchQuery ?
                <div className="text-center py-16 px-4 text-muted-foreground">
                        <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="font-semibold mb-2 text-base">No conversations yet</p>
                        <p className="text-sm mb-4">Start chatting by adding friends first</p>
                        <Button
                    onClick={() => navigate('/friends')}
                    className="bg-gradient-primary hover:shadow-glow">

                          Find Friends
                        </Button>
                      </div> :

                filteredChats.map((chat) => {
                  const otherParticipant = chat.participants.find((p) => p.user_id !== user?.id);
                  const chatName = chat.name || otherParticipant?.profiles.display_name || 'Unknown';
                  const chatUsername = otherParticipant?.profiles?.username;
                  const avatar = chat.avatar_url || otherParticipant?.profiles.avatar_url;
                  // Get last message from messages array for this chat
                  const chatMessages = messages.filter((m) => m.chat_id === chat.id);
                  const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;
                  const lastMessageTime = lastMessage?.created_at || chat.updated_at ?
                  formatDistanceToNow(new Date(lastMessage?.created_at || chat.updated_at), { addSuffix: false }).
                  replace('about ', '').
                  replace(' minutes', 'm').
                  replace(' minute', 'm').
                  replace(' hours', 'h').
                  replace(' hour', 'h').
                  replace(' days', 'd').
                  replace(' day', 'd').
                  replace(' weeks', 'w').
                  replace(' week', 'w').
                  replace(' months', 'mo').
                  replace(' month', 'mo').
                  replace('less than a', '<1') :
                  '';
                  const isOnlineUser = otherParticipant ? isUserOnline(otherParticipant.user_id) : false;
                  // Get last message snippet
                  const lastMessageSnippet = lastMessage?.content ?
                  lastMessage.content.length > 30 ? lastMessage.content.slice(0, 30) + '...' : lastMessage.content :
                  lastMessage?.media_url ? '📷 Media' : 'Tap to chat';

                  return (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 group border ${
                      selectedChatId === chat.id ?
                      'bg-gradient-primary/10 border-primary/30 shadow-md' :
                      'hover:bg-primary/5 border-transparent hover:border-primary/10'}`
                      }
                      onClick={() => setSelectedChatId(chat.id)}>

                            <div className="flex gap-3">
                              <div className="relative flex-shrink-0">
                                <Avatar className={`h-12 w-12 ring-2 transition-all ${
                          selectedChatId === chat.id ? 'ring-primary/50' : 'ring-border/50 group-hover:ring-primary/20'}`
                          }>
                                  <AvatarImage src={avatar} />
                                  <AvatarFallback className={selectedChatId === chat.id ? "bg-gradient-primary text-white" : "bg-muted"}>{chatName[0]}</AvatarFallback>
                                </Avatar>
                                {isOnlineUser &&
                          <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-success rounded-full border-2 border-background" />
                          }
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className={`font-semibold truncate text-sm md:text-base transition-colors ${
                            selectedChatId === chat.id ? 'text-primary' : 'group-hover:text-primary'}`
                            }>
                                    {chatName}
                                  </p>
                                  {lastMessageTime &&
                            <span className="text-xs flex-shrink-0 text-muted-foreground">
                                      {lastMessageTime}
                                    </span>
                            }
                                </div>
                                <div className="flex items-center gap-1">
                                  {lastMessage?.sender_id === user?.id &&
                            <Check className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                            }
                                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                                    {chat.is_group ? `${chat.participants.length} members` : lastMessageSnippet}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>);

                })
                }
                  </div>
            </ScrollArea>
          </div>

          {/* NewChatDialog is rendered at bottom of component */}

          {/* Chat Area */}
          <div className={`${selectedChatId || showAIChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative`}>
            {/* AI Assistant Chat */}
            {showAIChat ?
            <AIAssistantChat
              isAdmin={isAdmin}
              onBack={() => setShowAIChat(false)} /> :

            selectedChat ?
            <>
                {/* Chat Header */}
                <div
                className="p-2 border-b border-border/50 flex items-center justify-between bg-card/80 backdrop-blur-sm sticky top-0 z-10 cursor-pointer hover:bg-card/90 transition-colors"
                onClick={() => {
                  if (selectedChat?.is_group) {
                    setShowGroupInfo(true);
                  } else if (otherParticipant?.user_id) {
                    navigate(`/profile/${otherParticipant.user_id}`);
                  }
                }}>

                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Button
                    size="icon"
                    variant="ghost"
                    className="md:hidden flex-shrink-0 h-10 w-10 hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedChatId(null);
                    }}>

                      ←
                    </Button>
                    {(() => {
                    const otherParticipant = selectedChat.participants.find((p) => p.user_id !== user?.id);
                    const chatName = selectedChat.name || otherParticipant?.profiles.display_name || 'User';
                    const chatAvatar = selectedChat.avatar_url || otherParticipant?.profiles.avatar_url;

                    return (
                      <>
                            <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/20">
                              <AvatarImage src={chatAvatar} />
                              <AvatarFallback className="bg-gradient-primary text-white">{chatName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate text-[15px]">{chatName}</p>
                              <div className="flex items-center gap-2 text-[13px]">
                                {isOnline ?
                            <span className="text-primary">online</span> :

                            <span className="text-muted-foreground">{formatLastSeen()}</span>
                            }
                              </div>
                            </div>
                        </>);

                  })()}
                  </div>
                  <div className="flex gap-1 md:gap-2 flex-shrink-0">
                    {!selectedChat?.is_group &&
                  <>
                        <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCall('voice');
                        setIsCallInitiator(true);
                        toast({
                          title: 'Starting voice call...',
                          description: `Calling ${otherParticipant?.profiles.display_name || 'participant'}`
                        });
                        if ('Notification' in window && Notification.permission === 'granted') {
                          new Notification('Voice Call', {
                            body: `Calling ${otherParticipant?.profiles.display_name || 'participant'}`,
                            icon: '/favicon.ico'
                          });
                        }
                      }}>

                          <Phone className="h-5 w-5" />
                        </Button>
                        <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 hidden md:flex hover:bg-primary/10 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCall('video');
                        setIsCallInitiator(true);
                        toast({
                          title: 'Starting video call...',
                          description: `Calling ${otherParticipant?.profiles.display_name || 'participant'}`
                        });
                        if ('Notification' in window && Notification.permission === 'granted') {
                          new Notification('Video Call', {
                            body: `Calling ${otherParticipant?.profiles.display_name || 'participant'}`,
                            icon: '/favicon.ico'
                          });
                        }
                      }}>

                          <Video className="h-5 w-5" />
                        </Button>
                      </>
                  }
                    <ChatMenu
                    chatId={selectedChatId}
                    otherUserId={otherParticipant?.user_id}
                    onViewMedia={() => setShowMediaTab(true)}
                    onSearchInChat={() => setShowSearchDialog(true)}
                    onViewStarred={() => setShowStarredDialog(true)}
                    onWallpaperChange={() => setShowWallpaper(true)}
                    onClearChat={() => setShowClearChat(true)}
                    onBlock={() => setShowBlockDialog(true)}
                    onReport={() => setShowReportDialog(true)}
                    onDisappearingMessages={() => setShowDisappearingDialog(true)} />

                  </div>
                </div>

                {/* Messages Area */}
                <div
                className="flex-1 overflow-y-auto px-4 py-3 pb-4 bg-gradient-to-br from-background to-muted/20"
                style={chatSettings?.wallpaper_url ? {
                  backgroundImage: `url(${chatSettings.wallpaper_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}>

                  <div className="space-y-2 max-w-4xl mx-auto pb-[50px] my-[2px]">
                    {searchQuery.trim() && filteredMessages.length === 0 ?
                  <div className="text-center py-12 text-muted-foreground">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="font-medium mb-2">No messages found</p>
                        <p className="text-sm">Try a different search term</p>
                      </div> :

                  filteredMessages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    const senderProfile = selectedChat?.participants.find((p) => p.user_id === message.sender_id)?.profiles;

                    // Find replied-to message if this is a reply
                    const replyToData = message.reply_to ?
                    (() => {
                      const replyMsg = messages.find((m) => m.id === message.reply_to);
                      if (replyMsg) {
                        const replySenderProfile = selectedChat?.participants.find((p) => p.user_id === replyMsg.sender_id)?.profiles;
                        return {
                          id: replyMsg.id,
                          content: replyMsg.content || '',
                          sender_name: replySenderProfile?.display_name || 'Unknown',
                          media_url: replyMsg.media_url,
                          media_type: replyMsg.media_type
                        };
                      }
                      return undefined;
                    })() :
                    undefined;

                    return (
                      <EnhancedMessageBubble
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
                        bubbleColor={chatSettings?.theme_color}
                        replyTo={replyToData}
                        onEdit={isOwn ? handleEditMessage : undefined}
                        onDelete={isOwn ? (id) => setDeletingMessageId(id) : undefined}
                        onReply={() => setReplyingTo({
                          ...message,
                          sender: senderProfile
                        })}
                        onReact={reactToMessage}
                        onUnreact={unreactToMessage}
                        onStar={starMessage}
                        onUnstar={unstarMessage}
                        onForward={(id) => {
                          setForwardingMessageId(id);
                          setShowForwardDialog(true);
                        }}
                        onScrollToMessage={(msgId) => {
                          const element = document.getElementById(`message-${msgId}`);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }} />);


                  })
                  }
                    <div ref={messagesEndRef} />
                  </div>
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Section - Fixed at bottom */}
                <div className="fixed inset-x-0 bottom-0 md:absolute md:auto md:auto bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] z-[100] ml-[320px]">
                  {/* Typing Indicator */}
                  {selectedChatId && <TypingIndicator chatId={selectedChatId} />}

                  {/* Reply Preview */}
                  {replyingTo &&
                <div className="px-4 py-2 flex items-center justify-between bg-muted/50">
                      <div className="flex-1 min-w-0 border-l-4 border-primary pl-3">
                        <p className="text-xs font-medium text-primary mb-0.5">
                          {replyingTo.sender?.display_name}
                        </p>
                        <p className="text-sm truncate text-muted-foreground">
                          {replyingTo.content}
                        </p>
                      </div>
                      <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setReplyingTo(null)}
                    className="h-8 w-8">

                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                }

                  {/* Media Preview */}
                  {imagePreview &&
                <div className="px-4 py-2 flex items-center gap-3 bg-muted/50">
                      {isVideo ?
                  <video
                    src={imagePreview}
                    className="h-20 w-32 object-cover rounded-lg"
                    controls /> :


                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-lg" />

                  }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {isVideo ? '🎥 Video' : '📷 Image'} ready to send
                        </p>
                      </div>
                      <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setIsVideo(false);
                    }}
                    className="h-8 w-8">

                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                }

                  {/* Voice Recorder UI */}
                  {isRecordingVoice ?
                <div className="p-2">
                      <VoiceRecorder
                    onSend={(audioBlob, duration) => {
                      handleVoiceSend(audioBlob, duration);
                      setIsRecordingVoice(false);
                    }}
                    onCancel={() => setIsRecordingVoice(false)} />

                    </div> :

                <>
                      {/* Message Input */}
                      <form onSubmit={handleSendMessage} className="p-3 rounded-full">
                        <div className="flex items-end gap-2">
                          {/* Attachments Menu Button */}
                          <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-10 w-10 rounded-full hover:bg-primary/10 flex-shrink-0"
                        onClick={() => setShowAttachmentsSheet(true)}>

                            <Plus className="h-5 w-5" />
                          </Button>
                          <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleImageSelect} />

                          <input
                        type="file"
                        ref={cameraInputRef}
                        className="hidden"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageSelect} />

                          
                          {/* Input Container */}
                          <div className="flex-1 flex items-center gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 py-2 border border-border/50 focus-within:border-primary/50 transition-all">
                            <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-primary/10 flex-shrink-0">

                              <Smile className="h-5 w-5" />
                            </Button>
                            
                            <Input
                          ref={messageInputRef}
                          value={messageText}
                          onChange={(e) => {
                            setMessageText(e.target.value);
                            handleTyping();
                          }}
                          placeholder={editingMessageId ? "Edit message..." : "Type a message..."}
                          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 px-0"
                          disabled={isRecordingVoice}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }} />

                            
                            <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-primary/10 flex-shrink-0"
                          onClick={() => fileInputRef.current?.click()}
                          title="Attach image or video">

                              <Paperclip className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          {/* Send/Voice Button */}
                          {messageText.trim() || selectedImage ?
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 rounded-full bg-gradient-primary hover:shadow-glow flex-shrink-0 transition-all">

                              <Send className="h-5 w-5" />
                            </Button> :

                      <Button
                        type="button"
                        size="icon"
                        className="h-11 w-11 rounded-full bg-gradient-primary hover:shadow-glow flex-shrink-0 transition-all"
                        onClick={() => setIsRecordingVoice(true)}>

                              <Mic className="h-5 w-5" />
                            </Button>
                      }
                        </div>
                      </form>
                    </>
                }
                </div>
              </> :

            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center max-w-md px-6 space-y-4 animate-fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary opacity-20 blur-3xl rounded-full"></div>
                    <MessageCircle className="h-20 w-20 mx-auto text-primary relative z-10" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Your Messages</h3>
                  <p className="text-sm text-muted-foreground">
                    Send private messages to friends and connect with others in your network
                  </p>
                  <Button
                  onClick={() => setShowNewChatDialog(true)}
                  className="mt-4 bg-gradient-primary hover:shadow-glow transition-all duration-300">

                    <Plus className="h-4 w-4 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              </div>
            }
          </div>
        </Card>
      </main>

      {/* Dialogs */}
      <NewChatDialog
        open={showNewChatDialog}
        onClose={() => setShowNewChatDialog(false)}
        onSelectFriend={handleCreateNewChat} />


      <GroupChatDialog
        open={showGroupChatDialog}
        onOpenChange={setShowGroupChatDialog}
        onGroupCreated={(chatId) => {
          setSelectedChatId(chatId);
          refetchChats();
        }} />


      <StarredMessagesDialog
        open={showStarredDialog}
        onClose={() => setShowStarredDialog(false)}
        chatId={selectedChatId || undefined} />


      <ForwardMessageDialog
        open={showForwardDialog}
        onClose={() => {
          setShowForwardDialog(false);
          setForwardingMessageId(null);
        }}
        onForward={handleForwardMessage}
        chats={chats}
        currentChatId={selectedChatId || undefined} />


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

      {/* Additional Dialogs */}
      {showSearchDialog && selectedChatId &&
      <SearchInChatDialog
        chatId={selectedChatId}
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onMessageSelect={(msgId) => {
          // Scroll to message
          const msgEl = document.getElementById(`msg-${msgId}`);
          msgEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setShowSearchDialog(false);
        }} />

      }

      {showMediaTab && selectedChatId &&
      <ChatMediaTab
        chatId={selectedChatId} />

      }

      {showGroupInfo && selectedChatId && selectedChat?.is_group &&
      <GroupInfoDialog
        chatId={selectedChatId}
        open={showGroupInfo}
        onOpenChange={setShowGroupInfo} />

      }

      {showWallpaper && selectedChatId &&
      <WallpaperDialog
        chatId={selectedChatId}
        open={showWallpaper}
        onOpenChange={setShowWallpaper} />

      }

      {showClearChat && selectedChatId &&
      <ClearChatDialog
        chatId={selectedChatId}
        open={showClearChat}
        onOpenChange={setShowClearChat}
        onCleared={() => {
          refetchMessages();
          setShowClearChat(false);
        }} />

      }

      {showBlockDialog && otherParticipant &&
      <BlockUserDialog
        userId={otherParticipant.user_id}
        userName={otherParticipant.profiles.display_name}
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog} />

      }

      {showReportDialog && otherParticipant &&
      <ReportUserDialog
        userId={otherParticipant.user_id}
        userName={otherParticipant.profiles.username || ''}
        open={showReportDialog}
        onOpenChange={setShowReportDialog} />

      }

      {showLocationDialog &&
      <LocationShareDialog
        open={showLocationDialog}
        onOpenChange={setShowLocationDialog}
        onShare={async (lat, lon, address) => {
          const locationText = `📍 ${address || `${lat}, ${lon}`}`;
          await sendMessage(locationText);
          setShowLocationDialog(false);
        }} />

      }

      {showContactDialog &&
      <ContactShareDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
        onShare={async (contactIds) => {
          const contactText = `👤 Shared ${contactIds.length} contact${contactIds.length > 1 ? 's' : ''}`;
          await sendMessage(contactText);
          setShowContactDialog(false);
        }} />

      }

      {showChatSettings && selectedChatId &&
      <ChatSettingsDialog
        chatId={selectedChatId}
        open={showChatSettings}
        onOpenChange={setShowChatSettings} />

      }

      {showDisappearingDialog && selectedChatId &&
      <DisappearingMessagesDialog
        chatId={selectedChatId}
        isOpen={showDisappearingDialog}
        onClose={() => setShowDisappearingDialog(false)} />

      }

      {activeCall === 'voice' && selectedChatId && otherParticipant &&
      <VoiceCall
        chatId={selectedChatId}
        isInitiator={isCallInitiator}
        onEndCall={() => {
          setActiveCall(null);
          setIsCallInitiator(false);
        }}
        participantName={otherParticipant.profiles.display_name}
        participantAvatar={otherParticipant.profiles.avatar_url} />

      }

      {activeCall === 'video' && selectedChatId &&
      <VideoCall
        chatId={selectedChatId}
        isInitiator={isCallInitiator}
        onEndCall={() => {
          setActiveCall(null);
          setIsCallInitiator(false);
        }} />

      }

      {showReactionPicker && reactingToMessageId &&
      <ReactionPicker
        onReact={(reaction) => {
          reactToMessage(reactingToMessageId, reaction);
          setShowReactionPicker(false);
          setReactingToMessageId(null);
        }} />

      }

      {/* Attachments Sheet */}
      <ChatAttachmentsSheet
        open={showAttachmentsSheet}
        onOpenChange={setShowAttachmentsSheet}
        onGalleryClick={() => fileInputRef.current?.click()}
        onCameraClick={() => cameraInputRef.current?.click()}
        onGifsClick={() => toast({ title: 'GIFs coming soon!' })}
        onStickersClick={() => toast({ title: 'Stickers coming soon!' })}
        onFilesClick={() => fileInputRef.current?.click()}
        onLocationClick={() => setShowLocationDialog(true)}
        onContactsClick={() => setShowContactDialog(true)}
        onScheduleClick={() => {
          if (messageText.trim()) {
            setShowScheduleDialog(true);
          } else {
            toast({ title: 'Type a message first to schedule', variant: 'destructive' });
          }
        }} />


      {/* Schedule Message Dialog */}
      {showScheduleDialog && selectedChatId &&
      <ScheduleMessageDialog
        chatId={selectedChatId}
        content={messageText}
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        onScheduled={() => {
          setMessageText('');
          setShowScheduleDialog(false);
        }} />

      }
    </div>);

};

export default MessagesPage;