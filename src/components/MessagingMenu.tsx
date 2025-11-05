import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, MessageSquarePlus, Users, Search, Archive, AtSign, Settings, Palette } from 'lucide-react';

interface MessagingMenuProps {
  onNewChat?: () => void;
  onNewGroup?: () => void;
  onSearch?: () => void;
}

export const MessagingMenu = ({ onNewChat, onNewGroup, onSearch }: MessagingMenuProps) => {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onNewChat}>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New Chat
          <span className="ml-auto text-xs text-muted-foreground">N</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onNewGroup}>
          <Users className="mr-2 h-4 w-4" />
          New Group
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSearch}>
          <Search className="mr-2 h-4 w-4" />
          Search Chats
          <span className="ml-auto text-xs text-muted-foreground">⌘K</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/messages/archived')}>
          <Archive className="mr-2 h-4 w-4" />
          Archived
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/messages/mentions')}>
          <AtSign className="mr-2 h-4 w-4" />
          Mentions
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings/messaging')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings/creator-studio')}>
          <Palette className="mr-2 h-4 w-4" />
          Creator Tools
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
