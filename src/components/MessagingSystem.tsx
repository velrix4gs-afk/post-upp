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
  Paperclip
} from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

const MessagingSystem = () => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    chats, 
    loading, 
    sendMessage, 
    createChat 
  } = useMessages(selectedChatId || undefined);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    
    const chatName = chat.name || chat.participants
      .filter(p => p.user_id !== user?.id)
      .map(p => p.profiles.display_name)
      .join(', ');
      
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatId) return;
    
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleStartNewChat = async (friendId: string) => {
    const chatId = await createChat([friendId]);
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
    <div className="flex h-screen max-h-[800px] bg-background">
      {/* Chat List Sidebar */}
      <div className={`${selectedChatId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r`}>
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
                    <h3 className="font-semibold">
                      {selectedChat.name || 
                       getOtherParticipants(selectedChat).map(p => p.profiles.display_name).join(', ')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getOtherParticipants(selectedChat).length === 1 ? 'Active now' : 
                       `${selectedChat.participants.length} members`}
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
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwn = message.sender_id === user?.id;
                const showTime = true; // You can add logic to group messages by time
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} space-x-2`}
                  >
                    {!isOwn && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.sender.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {message.sender.display_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[70%] ${isOwn ? 'text-right' : 'text-left'}`}>
                      {!isOwn && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.sender.display_name}
                        </p>
                      )}
                      
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.is_edited && (
                          <p className="text-xs opacity-70 mt-1">edited</p>
                        )}
                      </div>
                      
                      {showTime && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatMessageTime(message.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Smile className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button 
                size="sm" 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
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
    </div>
  );
};

export default MessagingSystem;