import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Smile } from 'lucide-react';

interface ReactionPickerProps {
  onReact: (reaction: string) => void;
}

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export const ReactionPicker = ({ onReact }: ReactionPickerProps) => {
  const [open, setOpen] = useState(false);

  const handleReaction = (reaction: string) => {
    onReact(reaction);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 animate-scale-in" align="center">
        <div className="flex gap-1">
          {REACTIONS.map((reaction, i) => (
            <Button
              key={reaction}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:scale-125 active:scale-95 transition-all duration-200"
              style={{ animationDelay: `${i * 40}ms` }}
              onClick={() => handleReaction(reaction)}
            >
              {reaction}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
