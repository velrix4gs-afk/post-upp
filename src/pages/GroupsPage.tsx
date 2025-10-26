import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Plus, Users, Lock, Globe, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGroups } from '@/hooks/useGroups';

const GroupsPage = () => {
  const { groups, myGroups, loading, createGroup, joinGroup, leaveGroup } = useGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) return;
    
    await createGroup({
      ...formData,
      avatar: avatarFile || undefined,
    });
    
    setCreateDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      privacy: 'public',
    });
    setAvatarFile(null);
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMyGroups = myGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-4 max-w-6xl">
          <div className="text-center py-8">Loading groups...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Groups</h1>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-full bg-muted">
                      {avatarFile ? (
                        <img 
                          src={URL.createObjectURL(avatarFile)} 
                          alt="Group avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                  </Label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <p className="text-xs text-center text-muted-foreground">Click to add group image</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="Enter group name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group-description">Description</Label>
                  <Textarea
                    id="group-description"
                    placeholder="What's this group about?"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="group-privacy">Privacy</Label>
                  <Select value={formData.privacy} onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, privacy: value }))}>
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
              <Badge variant="secondary" className="ml-2">{myGroups.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="discover">
              Discover
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="mt-6">
            {filteredMyGroups.length === 0 ? (
              <Card className="bg-gradient-card border-0 p-8 md:p-12 text-center">
                <Users className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">No groups yet</h3>
                <p className="text-sm md:text-base text-muted-foreground mb-6">
                  Create or join groups to connect with people who share your interests
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMyGroups.map((group) => (
                  <Card key={group.id} className="bg-gradient-card border-0 overflow-hidden">
                    <div className="h-24 bg-gradient-primary relative">
                      {group.cover_url && (
                        <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <CardContent className="pt-0 -mt-10">
                      <Avatar className="h-20 w-20 border-4 border-background mb-3">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {group.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-semibold text-base md:text-lg mb-1">{group.name}</h3>
                      {group.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{group.member_count} members</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {group.role}
                        </Badge>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full text-sm"
                        onClick={() => leaveGroup(group.id)}
                      >
                        Leave Group
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover" className="mt-6">
            {filteredGroups.length === 0 ? (
              <Card className="bg-gradient-card border-0 p-8 md:p-12 text-center">
                <Search className="h-12 md:h-16 w-12 md:w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg md:text-xl font-semibold mb-2">No groups to discover yet</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Check back later for groups to join
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((group) => (
                  <Card key={group.id} className="bg-gradient-card border-0 overflow-hidden">
                    <div className="h-24 bg-gradient-primary relative">
                      {group.cover_url && (
                        <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <CardContent className="pt-0 -mt-10">
                      <Avatar className="h-20 w-20 border-4 border-background mb-3">
                        <AvatarImage src={group.avatar_url} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                          {group.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="font-semibold text-base md:text-lg mb-1">{group.name}</h3>
                      {group.description && (
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{group.member_count} members</span>
                        </div>
                        <Badge variant="outline" className="text-xs gap-1">
                          {group.privacy === 'public' ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {group.privacy}
                        </Badge>
                      </div>
                      
                      {group.is_member ? (
                        <Button 
                          variant="outline" 
                          className="w-full text-sm"
                          onClick={() => leaveGroup(group.id)}
                        >
                          Leave Group
                        </Button>
                      ) : (
                        <Button 
                          className="w-full text-sm"
                          onClick={() => joinGroup(group.id)}
                        >
                          Join Group
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default GroupsPage;
