import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Type, Smile, Image as ImageIcon, Send, Loader2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStories } from '@/hooks/useStories';
import { toast } from '@/hooks/use-toast';
import { BackNavigation } from './BackNavigation';

const textStyles = [
  { id: 'default', name: 'Classic', bg: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { id: 'warm', name: 'Warm', bg: 'bg-gradient-to-br from-orange-400 to-red-500' },
  { id: 'cool', name: 'Cool', bg: 'bg-gradient-to-br from-blue-400 to-cyan-500' },
  { id: 'dark', name: 'Dark', bg: 'bg-gradient-to-br from-gray-800 to-black' },
  { id: 'light', name: 'Light', bg: 'bg-gradient-to-br from-white to-gray-200' },
];

const CreateStoryPage = () => {
  const navigate = useNavigate();
  const { createStory } = useStories();
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(textStyles[0]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
    setMode('image');
  };

  const handlePost = async () => {
    if (mode === 'text' && !text.trim()) {
      toast({ title: 'Add some text first', variant: 'destructive' });
      return;
    }
    if (mode === 'image' && !image) {
      toast({ title: 'Select an image first', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      if (mode === 'image' && image) {
        await createStory(undefined, image);
      } else {
        await createStory(text, undefined);
      }
      toast({ title: 'Story posted! 🎉' });
      navigate('/');
    } catch (error) {
      console.error('Story creation error:', error);
      toast({ title: 'Failed to post story', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <BackNavigation />
          <h1 className="text-xl font-bold">Create Story</h1>
          <Button
            size="sm"
            onClick={handlePost}
            disabled={uploading || (mode === 'text' && !text.trim()) || (mode === 'image' && !image)}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative flex items-center justify-center bg-muted/20">
        {mode === 'text' ? (
          <div className={`w-full max-w-md aspect-[9/16] rounded-2xl ${selectedStyle.bg} flex items-center justify-center p-8 shadow-2xl`}>
            <p className="text-white text-3xl font-bold text-center break-words">
              {text || 'Type your story...'}
            </p>
          </div>
        ) : imagePreview ? (
          <div className="w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl">
            <img src={imagePreview} alt="Story preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full max-w-md aspect-[9/16] rounded-2xl bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No image selected</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mode === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('text')}
            className="flex-1"
          >
            <Type className="h-4 w-4 mr-2" />
            Text
          </Button>
          <Button
            variant={mode === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('image');
              fileInputRef.current?.click();
            }}
            className="flex-1"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </Button>
        </div>

        {mode === 'text' && (
          <>
            <Input
              placeholder="Type your story..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={200}
              className="text-lg"
            />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {textStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg ${style.bg} ${
                    selectedStyle.id === style.id ? 'ring-4 ring-primary' : ''
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
    </div>
  );
};

export default CreateStoryPage;
