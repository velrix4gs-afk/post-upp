import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePosts } from '@/hooks/usePosts';
import { toast } from 'sonner';

export const FixedPostBar = () => {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { createPost } = usePosts();

  const handlePost = async () => {
    if (!content.trim() || isPosting) return;

    setIsPosting(true);
    try {
      // Create the post
      await createPost({
        content: content.trim(),
        privacy: 'public'
      });

      setContent('');
      toast.success('Post created!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePost();
    }
  };

  return (
    <div className="fixed left-0 right-0 bottom-20 z-40 bg-background/95 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex items-end gap-2 px-3 py-2">
        {/* Text area */}
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-2xl px-4 py-2.5 text-sm"
          rows={1}
        />

        {/* Post button */}
        <Button
          size="sm"
          onClick={handlePost}
          disabled={!content.trim() || isPosting}
          className="rounded-full h-9 w-9 p-0 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
