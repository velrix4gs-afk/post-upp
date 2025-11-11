import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

const filters = [
  { id: 'none', name: 'Original', css: 'none' },
  { id: 'retro', name: 'Retro', css: 'sepia(50%) contrast(120%) saturate(150%)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(40%) brightness(105%) contrast(95%)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(100%) contrast(110%)' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
  { id: 'warm', name: 'Warm', css: 'saturate(130%) brightness(105%) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool', css: 'saturate(110%) hue-rotate(20deg)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(150%) brightness(90%) saturate(120%)' }
];

const CreateStory = ({ onStoryCreated }: CreateStoryProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      showCleanError({ code: 'STORY_001', message: 'File size must be less than 50MB' }, toast);
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

      // Create story with filter metadata
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
        title: '🎉 STORY ADDED',
        description: 'Your story is now live!'
      });

      // Reset form
      setContent('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedFilter('none');
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
        className="gap-2 bg-gradient-primary hover:shadow-glow rounded-full"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Add Story
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
              Create Story
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden">
                {selectedFile?.type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-80 object-cover"
                    style={{ filter: filters.find(f => f.id === selectedFilter)?.css || 'none' }}
                  />
                ) : (
                  <video
                    src={previewUrl}
                    className="w-full h-80 object-cover"
                    style={{ filter: filters.find(f => f.id === selectedFilter)?.css || 'none' }}
                    controls
                  />
                )}
                
                {/* Close Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-3 right-3 rounded-full shadow-lg"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setSelectedFilter('none');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Filter Selector - Horizontal Scroll */}
                {selectedFile?.type.startsWith('image/') && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                            selectedFilter === filter.id
                              ? 'bg-gradient-primary text-white shadow-glow'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {filter.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="story-media"
                />
                
                {/* Photo Button */}
                <label htmlFor="story-media" className="cursor-pointer">
                  <div className="group p-6 border-2 border-dashed border-primary/30 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-success/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Image className="h-6 w-6 text-success" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-foreground">Add Photo</p>
                        <p className="text-xs text-muted-foreground">Max 50MB</p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Video Button */}
                <label htmlFor="story-media" className="cursor-pointer">
                  <div className="group p-6 border-2 border-dashed border-destructive/30 rounded-2xl hover:border-destructive hover:bg-destructive/5 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-destructive/10 rounded-xl group-hover:scale-110 transition-transform">
                        <Video className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-foreground">Add Video</p>
                        <p className="text-xs text-muted-foreground">Up to 60 seconds</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            )}

            <Textarea
              placeholder="What's on your mind? 💭"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={200}
              className="rounded-2xl resize-none border-2 focus:border-primary"
            />

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-2 font-semibold"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full bg-gradient-primary font-semibold shadow-lg hover:shadow-glow"
                onClick={handleCreateStory}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? '⏳ Creating...' : '✨ Share Story'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateStory;
