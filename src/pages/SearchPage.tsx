import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, User, FileText, Users as UsersIcon, Hash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for users, posts, groups, or hashtags..."
              className="pl-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Users
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">User Name {i}</p>
                        <p className="text-sm text-muted-foreground">@username{i}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Follow</Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Posts
              </h3>
              <div className="space-y-3">
                <div className="p-3 hover:bg-muted rounded cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium">User Name</p>
                  </div>
                  <p className="text-sm">This is a sample post content that matches your search query...</p>
                  <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => navigate(`/profile/${i}`)}>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>U{i}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">User Name {i}</p>
                        <p className="text-sm text-muted-foreground">@username{i}</p>
                        <p className="text-xs text-muted-foreground">1.2K followers</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Follow</Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-3 hover:bg-muted rounded cursor-pointer border-b last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">User Name</p>
                        <p className="text-xs text-muted-foreground">@username · 2h ago</p>
                      </div>
                    </div>
                    <p className="text-sm mb-2">This is a sample post content that matches your search query. It can contain text, images, and more...</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>12 likes</span>
                      <span>5 comments</span>
                      <span>2 shares</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-muted rounded cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UsersIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">Group Name {i}</p>
                        <p className="text-sm text-muted-foreground">1.5K members · Public</p>
                      </div>
                    </div>
                    <Button size="sm">Join</Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-4 mt-4">
            <Card className="p-4">
              <div className="space-y-3">
                {['Technology', 'Sports', 'Music', 'Gaming', 'Food'].map(tag => (
                  <div key={tag} className="flex items-center justify-between p-3 hover:bg-muted rounded cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Hash className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">#{tag}</p>
                        <p className="text-sm text-muted-foreground">1.2K posts</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Follow</Button>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SearchPage;