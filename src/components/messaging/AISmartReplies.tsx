import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISmartRepliesProps {
  lastMessage?: string;
  onSelectReply: (reply: string) => void;
  className?: string;
}

export const AISmartReplies = ({ lastMessage, onSelectReply, className }: AISmartRepliesProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (lastMessage) {
      generateSuggestions(lastMessage);
    }
  }, [lastMessage]);

  const generateSuggestions = (message: string) => {
    // Simple rule-based smart replies
    const lowercased = message.toLowerCase();
    
    if (lowercased.includes('how are you') || lowercased.includes('how r u')) {
      setSuggestions(["I'm good, thanks! 😊", "Great! How about you?", "Doing well!"]);
    } else if (lowercased.includes('thanks') || lowercased.includes('thank you')) {
      setSuggestions(["You're welcome! 😊", "No problem!", "Happy to help!"]);
    } else if (lowercased.includes('?')) {
      setSuggestions(["Yes!", "No, thanks", "Let me check"]);
    } else if (lowercased.includes('😂') || lowercased.includes('lol')) {
      setSuggestions(["😂", "Haha right!", "That's funny!"]);
    } else if (lowercased.includes('sorry')) {
      setSuggestions(["It's okay!", "No worries", "All good!"]);
    } else {
      setSuggestions(["Sure! 👍", "Okay", "Got it!"]);
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2", className)}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
        <Sparkles className="h-3 w-3" />
        <span className="hidden sm:inline">Quick:</span>
      </div>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelectReply(suggestion)}
          className="whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-all"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
};