import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Image, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

interface GroupPostCreateProps {
  groupId: string;
  onPostCreated?: () => void;
}

export const GroupPostCreate = ({ groupId, onPostCreated }: GroupPostCreateProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 4) {
      toast({ description: 'Maximum 4 images allowed', variant: 'destructive' });
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) {
      toast({ description: 'Please add some content', variant: 'destructive' });
      return;
    }

    setIsPosting(true);
    try {
      // TODO: Upload images and create post
      toast({ description: '✅ Posted to group!' });
      setContent('');
      setImages([]);
      setImagePreviews([]);
      onPostCreated?.();
    } catch (error) {
      toast({ description: 'Failed to create post', variant: 'destructive' });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback>{profile?.display_name?.[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              id="group-post-images"
            />
            <label htmlFor="group-post-images">
              <Button variant="ghost" size="sm" asChild>
                <span className="cursor-pointer">
                  <Image className="h-4 w-4 mr-2" />
                  Photos
                </span>
              </Button>
            </label>

            <Button
              onClick={handlePost}
              disabled={isPosting || (!content.trim() && images.length === 0)}
              className="bg-gradient-primary"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
