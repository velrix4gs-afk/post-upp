import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Image, Video, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { showCleanError } from '@/lib/errorHandler';

interface CreateStoryProps {
  onStoryCreated?: () => void;
}

const CreateStory = ({ onStoryCreated }: CreateStoryProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showCleanError({ code: 'STORY_001', message: 'File size must be less than 10MB' }, toast);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      showCleanError({ code: 'STORY_002', message: 'Only images and videos are allowed' }, toast);
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateStory = async () => {
    if (!selectedFile || !user) {
      showCleanError({ code: 'STORY_003', message: 'Please select a file' }, toast);
      return;
    }

    setIsUploading(true);
    try {
      // Upload media
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`STORY_004: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      // Create story
      const { error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
          content: content.trim() || null
        });

      if (storyError) {
        throw new Error(`STORY_005: ${storyError.message}`);
      }

      toast({
        title: '✅ Success',
        description: 'Story created!'
      });

      // Reset form
      setContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsOpen(false);
      onStoryCreated?.();
    } catch (error: any) {
      showCleanError(error, toast, 'Story Creation Failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        className="gap-2 bg-gradient-primary hover:shadow-glow"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Story
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Story</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {previewUrl ? (
              <div className="relative">
                {selectedFile?.type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={previewUrl}
                    className="w-full h-64 object-cover rounded-lg"
                    controls
                  />
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="story-media"
                />
                <label htmlFor="story-media" className="flex-1">
                  <Card className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-4">
                        <Image className="h-8 w-8 text-success" />
                        <Video className="h-8 w-8 text-destructive" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Click to upload photo or video<br />
                        <span className="text-xs">Max 10MB</span>
                      </p>
                    </div>
                  </Card>
                </label>
              </div>
            )}

            <Textarea
              placeholder="Add a caption... (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={200}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-primary"
                onClick={handleCreateStory}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? 'Creating...' : 'Create Story'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateStory;
