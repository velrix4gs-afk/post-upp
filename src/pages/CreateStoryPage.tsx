import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Image, Video, Send, Loader2, Type, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BackNavigation } from '@/components/BackNavigation';

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

const CreateStoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'ERR_S1', description: 'File too large (max 50MB)', variant: 'destructive', duration: 1500 });
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({ title: 'ERR_S2', description: 'Only images/videos allowed', variant: 'destructive', duration: 1500 });
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
      toast({ title: 'ERR_S3', description: 'Select a file first', variant: 'destructive', duration: 1500 });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      const { error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url: publicUrl,
          media_type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
          content: content.trim() || null
        });

      if (storyError) throw storyError;

      toast({ title: '🎉 Story posted!', duration: 1500 });
      navigate('/');
    } catch (error: any) {
      toast({ title: 'ERR_S4', description: 'Post failed', variant: 'destructive', duration: 1500 });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <BackNavigation />
          <h1 className="text-xl font-bold">Create Story</h1>
          <Button
            size="sm"
            onClick={handleCreateStory}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {previewUrl ? (
          <>
            {selectedFile?.type.startsWith('video/') ? (
              <video
                src={previewUrl}
                className="max-h-full max-w-full object-contain"
                style={{ filter: filters.find(f => f.id === selectedFilter)?.css }}
                controls
                loop
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                style={{ filter: filters.find(f => f.id === selectedFilter)?.css }}
              />
            )}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70"
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              <X className="h-5 w-5 text-white" />
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
              id="story-file-input"
            />
            <label
              htmlFor="story-file-input"
              className="cursor-pointer flex flex-col items-center gap-4 p-8 rounded-2xl bg-muted hover:bg-muted/80 transition"
            >
              <div className="flex gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Image className="h-8 w-8 text-primary" />
                </div>
                <div className="p-4 rounded-full bg-primary/10">
                  <Video className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold">Upload Image or Video</p>
                <p className="text-sm text-muted-foreground mt-1">Max 50MB</p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      {selectedFile && (
        <div className="bg-background border-t p-4 space-y-4">
          {/* Caption */}
          <div>
            <Textarea
              placeholder="Add caption..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Filters */}
          <div>
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Filters
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedFilter === filter.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateStoryPage;
