import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Plus, Image, Video, X, Send, Type } from 'lucide-react';
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

      {/* Instagram-style Full Screen Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[100dvh] w-full p-0 border-0 rounded-none bg-black"
        >
          {/* No Preview - Upload Selection */}
          {!previewUrl ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-br from-background via-muted/20 to-primary/5">
              <div className="absolute top-4 left-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="text-center space-y-2 mb-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
                  Create Story
                </h2>
                <p className="text-muted-foreground">Share a moment with your friends</p>
              </div>

              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="story-upload"
              />

              <div className="w-full max-w-sm space-y-4">
                {/* Photo Upload */}
                <label htmlFor="story-upload" className="cursor-pointer block">
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-success/20 to-success/5 border-2 border-success/30 hover:border-success hover:scale-[1.02] transition-all p-8">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-success/20 rounded-2xl group-hover:scale-110 transition-transform">
                        <Image className="h-8 w-8 text-success" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xl font-bold text-foreground mb-1">Add Photo</p>
                        <p className="text-sm text-muted-foreground">Max 50MB • PNG, JPG, WEBP</p>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Video Upload */}
                <label htmlFor="story-upload" className="cursor-pointer block">
                  <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-destructive/20 to-destructive/5 border-2 border-destructive/30 hover:border-destructive hover:scale-[1.02] transition-all p-8">
                    <div className="flex items-center gap-6">
                      <div className="p-4 bg-destructive/20 rounded-2xl group-hover:scale-110 transition-transform">
                        <Video className="h-8 w-8 text-destructive" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xl font-bold text-foreground mb-1">Add Video</p>
                        <p className="text-sm text-muted-foreground">Up to 60s • MP4, MOV</p>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            /* Preview Mode - Instagram Style */
            <div className="h-full flex flex-col bg-black">
              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 pb-20">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setSelectedFilter('none');
                      setContent('');
                    }}
                    className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                    >
                      <Type className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Media Preview */}
              <div className="flex-1 relative overflow-hidden">
                {selectedFile?.type.startsWith('image/') ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    style={{ filter: filters.find(f => f.id === selectedFilter)?.css || 'none' }}
                  />
                ) : (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-contain"
                    style={{ filter: filters.find(f => f.id === selectedFilter)?.css || 'none' }}
                    controls
                    playsInline
                  />
                )}
              </div>

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent p-4 pt-12">
                {/* Caption Input */}
                <div className="mb-4">
                  <Input
                    placeholder="Add a caption..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={200}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-full px-4 py-6 text-base focus:bg-white/20 focus:border-white/40"
                  />
                </div>

                {/* Filter Selector - Only for images */}
                {selectedFile?.type.startsWith('image/') && (
                  <div className="mb-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {filters.map((filter) => (
                        <button
                          key={filter.id}
                          onClick={() => setSelectedFilter(filter.id)}
                          className="flex-shrink-0 flex flex-col items-center gap-2 group"
                        >
                          <div
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                              selectedFilter === filter.id
                                ? 'border-white scale-110 shadow-lg shadow-white/30'
                                : 'border-white/30 hover:border-white/50'
                            }`}
                          >
                            <img
                              src={previewUrl}
                              alt={filter.name}
                              className="w-full h-full object-cover"
                              style={{ filter: filter.css }}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium transition-all ${
                              selectedFilter === filter.id
                                ? 'text-white scale-110'
                                : 'text-white/60 group-hover:text-white/80'
                            }`}
                          >
                            {filter.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Share Button */}
                <Button
                  onClick={handleCreateStory}
                  disabled={!selectedFile || isUploading}
                  className="w-full h-14 rounded-full bg-gradient-primary hover:shadow-glow text-white font-bold text-lg disabled:opacity-50"
                >
                  {isUploading ? (
                    <>⏳ Sharing...</>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Share to Story
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CreateStory;
