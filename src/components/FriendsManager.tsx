import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, UserCheck, UserX, Users } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { useSearch } from '@/hooks/useSearch';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const FriendsManager = () => {
  const { user } = useAuth();
  const { 
    friends, 
    pendingRequests, 
    sentRequests,
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest,
    removeFriend 
  } = useFriends();
  const { results, search, loading: searchLoading } = useSearch();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      search(query);
    }
  };

  const userResults = results.filter(result => result.type === 'user');

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Friends</h1>
        <p className="text-muted-foreground">Manage your connections and discover new people</p>
      </div>

      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends">
            <Users className="h-4 w-4 mr-2" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <UserPlus className="h-4 w-4 mr-2" />
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="discover">
            <Search className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
              <p className="text-muted-foreground">Start by discovering people in the Discover tab</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {friends.map((friend) => (
                <Card key={friend.id} className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={friend.avatar_url} />
                      <AvatarFallback className="bg-gradient-primary text-white">
                        {friend.display_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{friend.display_name}</h3>
                      <p className="text-sm text-muted-foreground">@{friend.username}</p>
                    </div>
                    {friend.is_verified && (
                      <Badge variant="secondary" className="h-4 px-1 text-xs">✓</Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Message
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeFriend(friend.id)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No friend requests</h3>
              <p className="text-muted-foreground">You'll see friend requests here when you receive them</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.requester.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {request.requester.display_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.requester.display_name}</h3>
                        <p className="text-sm text-muted-foreground">@{request.requester.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
                        onClick={() => acceptFriendRequest(request.requester_id)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => declineFriendRequest(request.requester_id)}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
              <p className="text-muted-foreground">Friend requests you send will appear here</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.addressee.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {request.addressee.display_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.addressee.display_name}</h3>
                        <p className="text-sm text-muted-foreground">@{request.addressee.username}</p>
                        <p className="text-xs text-muted-foreground">
                          Sent {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for people..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {searchLoading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Searching...</p>
            </div>
          )}

          {userResults.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userResults.map((result) => {
                const isCurrentUser = result.id === user?.id;
                const isFriend = friends.some(f => f.id === result.id);
                const hasPendingRequest = pendingRequests.some(r => r.requester_id === result.id);
                const hasSentRequest = sentRequests.some(r => r.addressee_id === result.id);

                return (
                  <Card key={result.id} className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={result.avatar} />
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {result.title.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{result.title}</h3>
                        <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                      </div>
                      {result.verified && (
                        <Badge variant="secondary" className="h-4 px-1 text-xs">✓</Badge>
                      )}
                    </div>
                    
                    {!isCurrentUser && (
                      <div className="flex space-x-2">
                        {isFriend ? (
                          <Button variant="outline" size="sm" className="flex-1" disabled>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Friends
                          </Button>
                        ) : hasPendingRequest ? (
                          <div className="flex space-x-2 flex-1">
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => acceptFriendRequest(result.id)}
                            >
                              Accept
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => declineFriendRequest(result.id)}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : hasSentRequest ? (
                          <Button variant="outline" size="sm" className="flex-1" disabled>
                            Pending
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => sendFriendRequest(result.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Friend
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {searchQuery && !searchLoading && userResults.length === 0 && (
            <Card className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">Try searching with different keywords</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendsManager;