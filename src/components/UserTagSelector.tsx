import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserTagSelectorProps {
  selectedUsers: string[];
  onUsersChange: (users: string[]) => void;
}

interface User {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
}

export const UserTagSelector = ({ selectedUsers, onUsersChange }: UserTagSelectorProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFriends();
  }, [user]);

  useEffect(() => {
    if (selectedUsers.length > 0) {
      fetchSelectedUserDetails();
    }
  }, [selectedUsers]);

  const fetchFriends = async () => {
    try {
      if (!user) return;

      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Get friend IDs
      const friendIds = friendships?.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      ) || [];

      if (friendIds.length === 0) {
        setUsers([]);
        return;
      }

      // Fetch friend profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', friendIds);

      if (profileError) throw profileError;

      setUsers(profiles || []);
    } catch (err) {
      console.error('[TAG_001] Error fetching friends:', err);
    }
  };

  const fetchSelectedUserDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url')
        .in('id', selectedUsers);

      if (error) throw error;
      setSelectedUserDetails(data || []);
    } catch (err) {
      console.error('[TAG_002] Error fetching user details:', err);
    }
  };

  const handleSelect = (userId: string) => {
    if (!selectedUsers.includes(userId)) {
      onUsersChange([...selectedUsers, userId]);
    }
    setOpen(false);
  };

  const handleRemove = (userId: string) => {
    onUsersChange(selectedUsers.filter(id => id !== userId));
  };

  const filteredUsers = users.filter(u => 
    u.display_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <UserPlus className="h-4 w-4 mr-2" />
            Tag People
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Search friends..." 
              value={search}
              onValueChange={setSearch}
            />
            <CommandEmpty>No friends found.</CommandEmpty>
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user.id)}
                  disabled={selectedUsers.includes(user.id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {user.display_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.display_name}</span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedUserDetails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUserDetails.map((user) => (
            <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
              <Avatar className="h-4 w-4">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-[10px]">
                  {user.display_name[0]}
                </AvatarFallback>
              </Avatar>
              {user.display_name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
