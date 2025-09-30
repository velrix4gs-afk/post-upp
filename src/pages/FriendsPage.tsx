import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, UserMinus, UserCheck, X, Check } from 'lucide-react';

const FriendsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const mockFriends = [
    { id: '1', name: 'John Doe', username: 'johndoe', avatar: '', status: 'online' },
    { id: '2', name: 'Jane Smith', username: 'janesmith', avatar: '', status: 'offline' },
    { id: '3', name: 'Mike Johnson', username: 'mikej', avatar: '', status: 'online' },
  ];

  const mockRequests = [
    { id: '4', name: 'Sarah Wilson', username: 'sarahw', avatar: '', mutualFriends: 5 },
    { id: '5', name: 'Tom Brown', username: 'tombrown', avatar: '', mutualFriends: 3 },
  ];

  const mockSuggestions = [
    { id: '6', name: 'Emily Davis', username: 'emilyd', avatar: '', mutualFriends: 8 },
    { id: '7', name: 'Chris Lee', username: 'chrisl', avatar: '', mutualFriends: 2 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">Friends</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All Friends
              <Badge variant="secondary" className="ml-2">{mockFriends.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="online">
              Online
              <Badge variant="secondary" className="ml-2">
                {mockFriends.filter(f => f.status === 'online').length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              <Badge variant="destructive" className="ml-2">{mockRequests.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="suggestions">
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockFriends.map(friend => (
                <Card key={friend.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback>{friend.name[0]}</AvatarFallback>
                      </Avatar>
                      {friend.status === 'online' && (
                        <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.name}</p>
                      <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          Message
                        </Button>
                        <Button size="sm" variant="ghost">
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="online" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockFriends.filter(f => f.status === 'online').map(friend => (
                <Card key={friend.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback>{friend.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.name}</p>
                      <p className="text-sm text-muted-foreground truncate">@{friend.username}</p>
                      <Badge variant="outline" className="mt-2">Online</Badge>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1">
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <div className="space-y-4">
              {mockRequests.map(request => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback>{request.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{request.name}</p>
                      <p className="text-sm text-muted-foreground">@{request.username}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {request.mutualFriends} mutual friends
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline">
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockSuggestions.map(user => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {user.mutualFriends} mutual friends
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" className="flex-1">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Friend
                        </Button>
                        <Button size="sm" variant="outline">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FriendsPage;