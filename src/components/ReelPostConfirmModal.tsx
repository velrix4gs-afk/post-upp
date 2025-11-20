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
}

export const ReelPostConfirmModal = ({
  open,
  onOpenChange,
  videoPreview,
  onConfirm,
}: ReelPostConfirmModalProps) => {
  const [caption, setCaption] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !tags.includes(tag)) {
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Reel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
            <video
              src={videoPreview}
              className="w-full h-full object-cover"
              controls
              loop
            />
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
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
                  className="pl-9"
                />
              </div>
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            
            {/* Tag List */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPosting}>
            Cancel
          </Button>
          <Button onClick={handlePost} disabled={isPosting}>
            {isPosting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post Reel
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
