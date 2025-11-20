import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { X, Camera, Play, Music, Send, Loader2, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReels } from '@/hooks/useReels';
import { toast } from '@/hooks/use-toast';
import { BackNavigation } from '@/components/BackNavigation';
import { ReelPostConfirmModal } from '@/components/ReelPostConfirmModal';

const filters = [
  { id: 'none', name: 'Original', css: 'none' },
  { id: 'warm', name: 'Warm', css: 'saturate(130%) brightness(105%) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool', css: 'saturate(110%) hue-rotate(20deg)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(200%) contrast(110%)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(150%) brightness(90%)' },
];

const CreateReelPage = () => {
  const navigate = useNavigate();
  const { createReel } = useReels();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast({ title: 'Video too large (max 500MB)', variant: 'destructive' });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({ title: 'Please select a video file', variant: 'destructive' });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSpeedChange = (value: number[]) => {
    const speed = value[0];
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handlePublish = async (data: { caption: string; tags: string[] }) => {
    if (!videoFile) return;

    setUploading(true);
    try {
      await createReel(videoFile, data.caption);
      toast({ title: 'Reel posted! 🎉' });
      navigate('/reels');
    } catch (error) {
      console.error('Reel creation error:', error);
      toast({ title: 'Failed to post reel', variant: 'destructive' });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <BackNavigation />
          <h1 className="text-xl font-bold">Create Reel</h1>
          <Button
            size="sm"
            onClick={() => setShowConfirmModal(true)}
            disabled={uploading || !videoFile}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {videoPreview ? (
          <video
            ref={videoRef}
            src={videoPreview}
            className="max-h-full max-w-full object-contain"
            controls
            loop
            style={{ filter: filters.find(f => f.id === selectedFilter)?.css }}
          />
        ) : (
          <div className="text-center">
            <Film className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No video selected</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Camera className="h-4 w-4 mr-2" />
              Select Video
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      {videoFile && (
        <div className="p-4 border-t space-y-4 bg-background">
          <Input
            placeholder="Add a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={150}
          />

          <div>
            <label className="text-sm font-medium mb-2 block">Speed: {playbackSpeed.toFixed(1)}x</label>
            <Slider
              value={[playbackSpeed]}
              onValueChange={handleSpeedChange}
              min={0.5}
              max={2}
              step={0.1}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filter</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedFilter(filter.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg border ${
                    selectedFilter === filter.id ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  {filter.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default CreateReelPage;
