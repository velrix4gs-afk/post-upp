import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Users, Lock, Globe, Settings } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const GroupsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState('public');

  const mockGroups = [
    { id: '1', name: 'Tech Enthusiasts', members: 1234, type: 'public', role: 'admin' },
    { id: '2', name: 'Photography Club', members: 567, type: 'private', role: 'member' },
    { id: '3', name: 'Book Readers', members: 890, type: 'public', role: 'member' },
  ];

  const mockDiscoverGroups = [
    { id: '4', name: 'Gaming Community', members: 5432, type: 'public' },
    { id: '5', name: 'Fitness & Health', members: 3210, type: 'public' },
    { id: '6', name: 'Music Lovers', members: 2100, type: 'private' },
  ];

  const handleCreateGroup = () => {
    console.log('Creating group:', { newGroupName, newGroupDescription, newGroupPrivacy });
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupPrivacy('public');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Groups</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description">Description</Label>
                  <Textarea
                    id="group-description"
                    placeholder="What's this group about?"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-privacy">Privacy</Label>
                  <Select value={newGroupPrivacy} onValueChange={setNewGroupPrivacy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can join</SelectItem>
                      <SelectItem value="private">Private - Invite only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreateGroup}>
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="my-groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-groups">
              My Groups
              <Badge variant="secondary" className="ml-2">{mockGroups.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="discover">
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockGroups.map(group => (
                <Card key={group.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20" />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {group.type === 'public' ? (
                            <Globe className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground capitalize">{group.type}</span>
                        </div>
                      </div>
                      {group.role === 'admin' && (
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{group.members.toLocaleString()} members</span>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Group
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discover" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockDiscoverGroups.map(group => (
                <Card key={group.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-secondary/20" />
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {group.type === 'public' ? (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground capitalize">{group.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{group.members.toLocaleString()} members</span>
                    </div>
                    <Button className="w-full">
                      Join Group
                    </Button>
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

export default GroupsPage;