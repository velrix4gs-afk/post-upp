import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, Heart, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  content?: string;
  created_at: string;
  profiles: {
    display_name: string;
    username: string;
    avatar_url?: string;
  };
}

interface StoryViewerProps {
  stories: Story[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const StoryViewer = ({ stories, currentIndex, onClose, onNext, onPrevious }: StoryViewerProps) => {
  const [message, setMessage] = useState('');
  const currentStory = stories[currentIndex];

  if (!currentStory) return null;

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Implement send message to story owner
    console.log('Send message:', message);
    setMessage('');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10 ring-2 ring-white">
              <AvatarImage src={currentStory.profiles.avatar_url} />
              <AvatarFallback>{currentStory.profiles.display_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-white font-semibold">{currentStory.profiles.display_name}</p>
              <p className="text-white/80 text-xs">@{currentStory.profiles.username}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress bars */}
        <div className="flex gap-1 mt-3 max-w-2xl mx-auto">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
            >
              {index < currentIndex && (
                <div className="h-full bg-white w-full" />
              )}
              {index === currentIndex && (
                <div className="h-full bg-white w-full animate-progress" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full max-w-2xl h-full max-h-[80vh] flex items-center justify-center">
        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={currentStory.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            loop
          />
        )}

        {currentStory.content && (
          <div className="absolute bottom-20 left-0 right-0 p-4">
            <p className="text-white text-center text-lg font-medium drop-shadow-lg">
              {currentStory.content}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
          onClick={onNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}

      {/* Reply Input */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <Heart className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Send a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
