import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, X, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReelPostConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoPreview: string;
  onConfirm: (data: { caption: string; tags: string[] }) => Promise<void>;
  isUploading?: boolean;
}

export const ReelPostConfirmModal = ({
  open,
  onOpenChange,
  videoPreview,
  onConfirm,
  isUploading = false,
}: ReelPostConfirmModalProps) => {
  const [caption, setCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePost = async () => {
    setIsPosting(true);
    try {
      await onConfirm({ caption, tags });
      setCaption('');
      setTags([]);
      setTagInput('');
      onOpenChange(false);
    } catch (error) {
      console.error('Post error:', error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
            Share Your Reel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Video Preview */}
          <div className="relative aspect-[9/16] max-h-[40vh] bg-black rounded-xl overflow-hidden shadow-2xl ring-2 ring-primary/20">
            <video
              src={videoPreview}
              className="w-full h-full object-cover"
              loop
              muted
              autoPlay
              playsInline
            />
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption" className="text-sm font-semibold">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
              maxLength={500}
              className="resize-none focus-visible:ring-primary"
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label htmlFor="tags" className="text-sm font-semibold">Tags (optional)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag"
                  maxLength={30}
                  className="pl-9 focus-visible:ring-primary"
                  disabled={tags.length >= 10}
                />
              </div>
              <Button 
                type="button" 
                onClick={addTag} 
                variant="outline"
                disabled={!tagInput.trim() || tags.length >= 10}
                className="hover:bg-primary/10"
              >
                Add
              </Button>
            </div>
            
            {/* Tag List */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="gap-1 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 transition-colors"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {tags.length >= 10 && (
              <p className="text-xs text-muted-foreground">Maximum 10 tags reached</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isPosting || isUploading}
            className="hover:bg-muted"
          >
            Back
          </Button>
          <Button 
            onClick={handlePost} 
            disabled={isPosting || isUploading || !caption.trim()}
            className="bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90 min-w-[100px]"
          >
            {isPosting || isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
