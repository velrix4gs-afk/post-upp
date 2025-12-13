import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, Send, Type, Pencil, Smile, Wand2, Image as ImageIcon, 
  Camera, RefreshCw, Zap, Timer, Settings, Music, Sparkles,
  LayoutGrid, Undo2, Redo2, Download, Users, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { StoryFilterPicker, storyFilters } from '@/components/story/StoryFilters';
import { StoryStickerPicker, StickerDisplay, Sticker } from '@/components/story/StoryStickers';
import { StoryTextOverlay } from '@/components/story/StoryTextOverlay';
import { StoryDrawing } from '@/components/story/StoryDrawing';
import { StoryAudienceSelector, StoryAudience } from '@/components/story/StoryAudienceSelector';
import { Loader2 } from 'lucide-react';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

type EditorMode = 'capture' | 'preview' | 'text' | 'draw' | 'stickers' | 'filters' | 'audience';

const textBackgrounds = [
  { id: 'gradient1', bg: 'bg-gradient-to-br from-purple-600 to-pink-500' },
  { id: 'gradient2', bg: 'bg-gradient-to-br from-blue-500 to-cyan-400' },
  { id: 'gradient3', bg: 'bg-gradient-to-br from-orange-500 to-red-500' },
  { id: 'gradient4', bg: 'bg-gradient-to-br from-green-500 to-emerald-400' },
  { id: 'gradient5', bg: 'bg-gradient-to-br from-indigo-600 to-purple-500' },
  { id: 'dark', bg: 'bg-gradient-to-br from-gray-900 to-black' },
  { id: 'light', bg: 'bg-gradient-to-br from-gray-100 to-white' },
];

const CreateStoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Core state
  const [mode, setMode] = useState<EditorMode>('capture');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('text');
  const [isUploading, setIsUploading] = useState(false);

  // Text story state
  const [storyText, setStoryText] = useState('');
  const [textBackground, setTextBackground] = useState(textBackgrounds[0]);

  // Editing state
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [drawingOverlay, setDrawingOverlay] = useState<string | null>(null);
  const [audience, setAudience] = useState<StoryAudience>('public');

  // Camera state (for future camera integration)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [flashEnabled, setFlashEnabled] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 50MB allowed', variant: 'destructive' });
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({ title: 'Invalid file', description: 'Only images and videos allowed', variant: 'destructive' });
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    setMode('preview');
  };

  const handleAddText = () => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: 'Tap to edit',
      x: 50,
      y: 50,
      color: '#FFFFFF',
      fontSize: 32,
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      align: 'center'
    };
    setTextOverlays(prev => [...prev, newOverlay]);
    setEditingTextId(newOverlay.id);
  };

  const handleUpdateTextOverlay = (updated: TextOverlay) => {
    setTextOverlays(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleDeleteTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(t => t.id !== id));
    setEditingTextId(null);
  };

  const handleAddSticker = (stickerData: Omit<Sticker, 'id' | 'x' | 'y'>) => {
    const newSticker: Sticker = {
      ...stickerData,
      id: Date.now().toString(),
      x: 50,
      y: 50
    };
    setStickers(prev => [...prev, newSticker]);
    setMode('preview');
  };

  const handleDeleteSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const handleSaveDrawing = (dataUrl: string) => {
    setDrawingOverlay(dataUrl);
    setMode('preview');
  };

  const handleClose = () => {
    if (mediaFile || storyText) {
      // Could add confirmation dialog here
    }
    navigate('/');
  };

  const handleShare = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      let media_url = null;
      let media_type = null;
      let content = null;

      if (mediaType === 'text') {
        content = storyText;
      } else if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('stories')
          .upload(fileName, mediaFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName);

        media_url = publicUrl;
        media_type = mediaType;
      }

      const { error: storyError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          media_url,
          media_type,
          content
        });

      if (storyError) throw storyError;

      toast({ title: 'Story shared! 🎉' });
      navigate('/');
    } catch (error: any) {
      console.error('Story creation error:', error);
      toast({ title: 'Failed to share story', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const currentFilter = storyFilters.find(f => f.id === selectedFilter);

  // Render capture mode (initial screen)
  if (mode === 'capture') {
    return (
      <div className="fixed inset-0 bg-black flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/10">
            <X className="h-6 w-6" />
          </Button>
          <span className="text-white font-semibold text-lg">Create Story</span>
          <div className="w-10" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
          {/* Text Story Option */}
          <div className="w-full max-w-sm">
            <div 
              className={`aspect-[9/16] rounded-3xl ${textBackground.bg} flex items-center justify-center p-6 shadow-2xl cursor-pointer relative overflow-hidden`}
              onClick={() => setMode('preview')}
            >
              <textarea
                value={storyText}
                onChange={(e) => {
                  setStoryText(e.target.value);
                  setMediaType('text');
                }}
                placeholder="Type your story..."
                className="w-full h-full bg-transparent text-white text-2xl font-bold text-center resize-none focus:outline-none placeholder:text-white/50"
                style={{ caretColor: 'white' }}
              />
            </div>
            
            {/* Background Picker */}
            <div className="flex gap-2 justify-center mt-4">
              {textBackgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setTextBackground(bg)}
                  className={`w-10 h-10 rounded-full ${bg.bg} border-2 transition-all ${
                    textBackground.id === bg.id ? 'border-white scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-sm">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/50 text-sm">or</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          {/* Media Upload Options */}
          <div className="flex gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-3 px-6 py-6"
            >
              <ImageIcon className="h-6 w-6" />
              <span>Gallery</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => toast({ title: 'Camera coming soon!' })}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-3 px-6 py-6"
            >
              <Camera className="h-6 w-6" />
              <span>Camera</span>
            </Button>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="p-6 text-center">
          <p className="text-white/50 text-sm">
            Type a text story or select media from your gallery
          </p>
        </div>
      </div>
    );
  }

  // Render sticker picker
  if (mode === 'stickers') {
    return (
      <StoryStickerPicker
        onSelect={handleAddSticker}
        onClose={() => setMode('preview')}
      />
    );
  }

  // Render drawing mode
  if (mode === 'draw') {
    return (
      <StoryDrawing
        canvasWidth={1080}
        canvasHeight={1920}
        onSave={handleSaveDrawing}
        onClose={() => setMode('preview')}
      />
    );
  }

  // Render audience selector
  if (mode === 'audience') {
    return (
      <StoryAudienceSelector
        selected={audience}
        onSelect={setAudience}
        onClose={() => setMode('preview')}
      />
    );
  }

  // Render editing text overlay
  const editingOverlay = textOverlays.find(t => t.id === editingTextId);
  if (editingTextId && editingOverlay) {
    return (
      <StoryTextOverlay
        overlay={editingOverlay}
        onUpdate={handleUpdateTextOverlay}
        onDelete={handleDeleteTextOverlay}
        isEditing={true}
        onEditComplete={() => setEditingTextId(null)}
      />
    );
  }

  // Render preview/editing mode
  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (mediaFile) {
              setMediaFile(null);
              setMediaPreview(null);
              setMode('capture');
            } else {
              handleClose();
            }
          }} 
          className="text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMode('audience')}
            className="text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm"
          >
            <Users className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleShare}
            disabled={isUploading || (!mediaFile && !storyText.trim())}
            className="bg-primary hover:bg-primary/90 gap-2 px-4"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Share
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleAddText}
          className="text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm rounded-full w-12 h-12"
        >
          <Type className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMode('draw')}
          className="text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm rounded-full w-12 h-12"
        >
          <Pencil className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMode('stickers')}
          className="text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm rounded-full w-12 h-12"
        >
          <Smile className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toast({ title: 'Music coming soon!' })}
          className="text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm rounded-full w-12 h-12"
        >
          <Music className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toast({ title: 'Effects coming soon!' })}
          className="text-white hover:bg-white/10 bg-black/30 backdrop-blur-sm rounded-full w-12 h-12"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </div>

      {/* Preview Area */}
      <div 
        ref={previewRef}
        className="flex-1 flex items-center justify-center relative overflow-hidden"
      >
        {mediaType === 'text' ? (
          <div 
            className={`w-full h-full ${textBackground.bg} flex items-center justify-center p-8`}
          >
            <p className="text-white text-3xl font-bold text-center break-words max-w-[80%]">
              {storyText || 'Type your story...'}
            </p>
          </div>
        ) : mediaPreview ? (
          <>
            {mediaType === 'video' ? (
              <video
                src={mediaPreview}
                className="w-full h-full object-contain"
                style={{ filter: currentFilter?.css || 'none' }}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={mediaPreview}
                alt="Story preview"
                className="w-full h-full object-contain"
                style={{ filter: currentFilter?.css || 'none' }}
              />
            )}
          </>
        ) : null}

        {/* Drawing Overlay */}
        {drawingOverlay && (
          <img
            src={drawingOverlay}
            alt="Drawing"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Text Overlays */}
        {textOverlays.map((overlay) => (
          <div
            key={overlay.id}
            onClick={() => setEditingTextId(overlay.id)}
            className="cursor-pointer"
          >
            <StoryTextOverlay
              overlay={overlay}
              onUpdate={handleUpdateTextOverlay}
              onDelete={handleDeleteTextOverlay}
              isEditing={false}
              onEditComplete={() => {}}
            />
          </div>
        ))}

        {/* Stickers */}
        {stickers.map((sticker) => (
          <StickerDisplay
            key={sticker.id}
            sticker={sticker}
            onDelete={handleDeleteSticker}
          />
        ))}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
        {/* Filters (only for image/video) */}
        {mediaPreview && mediaType !== 'text' && (
          <StoryFilterPicker
            selectedFilter={selectedFilter}
            onSelect={setSelectedFilter}
            previewUrl={mediaPreview}
          />
        )}

        {/* Text Background Picker (only for text stories) */}
        {mediaType === 'text' && (
          <div className="flex gap-2 justify-center p-4">
            {textBackgrounds.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setTextBackground(bg)}
                className={`w-8 h-8 rounded-full ${bg.bg} border-2 transition-all ${
                  textBackground.id === bg.id ? 'border-white scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        )}

        {/* Gallery Button */}
        <div className="flex justify-center pb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-white hover:bg-white/10 gap-2"
          >
            <LayoutGrid className="h-4 w-4" />
            Change Media
          </Button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default CreateStoryPage;
