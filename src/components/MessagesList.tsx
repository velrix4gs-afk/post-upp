import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MessageCircle, 
  Phone, 
  Video,
  MoreHorizontal
} from "lucide-react";

interface Message {
  id: string;
  user: {
    name: string;
    avatar?: string;
    isOnline: boolean;
  };
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

const mockMessages: Message[] = [
  {
    id: "1",
    user: { name: "Sarah Johnson", isOnline: true },
    lastMessage: "Hey! How was your weekend? 😊",
    timestamp: "2m",
    unreadCount: 2
  },
  {
    id: "2", 
    user: { name: "Mike Chen", isOnline: true },
    lastMessage: "Thanks for sharing that article!",
    timestamp: "1h",
    unreadCount: 0
  },
  {
    id: "3",
    user: { name: "Emma Wilson", isOnline: false },
    lastMessage: "Let's catch up soon 💕",
    timestamp: "3h",
    unreadCount: 1
  },
  {
    id: "4",
    user: { name: "Alex Rodriguez", isOnline: false },
    lastMessage: "The project looks great!",
    timestamp: "1d",
    unreadCount: 0
  }
];

const MessagesList = () => {
  return (
    <Card className="bg-gradient-card border-0 shadow-sm h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search messages..." 
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        {mockMessages.map((message) => (
          <div
            key={message.id}
            className="flex items-center p-4 hover:bg-muted/20 cursor-pointer transition-colors border-b last:border-b-0"
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={message.user.avatar} />
                <AvatarFallback className="bg-gradient-primary text-white">
                  {message.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {/* Online Status */}
              <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card ${
                message.user.isOnline ? 'bg-online' : 'bg-offline'
              }`} />
            </div>

            <div className="flex-1 ml-3 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-sm truncate">{message.user.name}</h3>
                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{message.lastMessage}</p>
            </div>

            {message.unreadCount > 0 && (
              <Badge className="bg-primary text-white ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {message.unreadCount}
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="border-t p-4">
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm" className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MessagesList;