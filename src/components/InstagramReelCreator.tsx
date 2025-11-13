import { useState, useRef } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { X, Image as ImageIcon, Camera, Play, Music, Scissors, Send, Loader2 } from 'lucide-react';
import { useReels } from '@/hooks/useReels';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface InstagramReelCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReelCreated?: () => void;
}

const filters = [
  { id: 'none', name: 'Original', css: 'none' },
  { id: 'warm', name: 'Warm', css: 'saturate(130%) brightness(105%) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool', css: 'saturate(110%) hue-rotate(20deg)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(200%) contrast(110%)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(150%) brightness(90%)' },
  { id: 'retro', name: 'Retro', css: 'sepia(50%) contrast(120%)' },
  { id: 'bw', name: 'B&W', css: 'grayscale(100%)' },
];

export const InstagramReelCreator = ({ open, onOpenChange, onReelCreated }: InstagramReelCreatorProps) => {
  const { createReel } = useReels();
  const [step, setStep] = useState<'select' | 'edit' | 'publish'>('select');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: 'Video too large',
        description: 'Video must be less than 500MB',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setStep('edit');
  };

  const handleSpeedChange = (value: number[]) => {
    const speed = value[0];
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handlePublish = async () => {
    if (!videoFile) return;

    setUploading(true);
    try {
      await createReel(videoFile, caption);
      toast({
        title: 'Reel posted! 🎉',
        description: 'Your reel is now live',
      });
      onReelCreated?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Failed to post reel',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setStep('select');
    setVideoFile(null);
    setVideoPreview(null);
    setCaption('');
    setSelectedFilter('none');
    setPlaybackSpeed(1);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[100dvh] w-full p-0 border-0 rounded-none bg-black">
        {/* Step 1: Video Selection */}
        {step === 'select' && (
          <div className="h-full flex flex-col items-center justify-center gap-6 p-6 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="text-center space-y-2 mb-4">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Create Reel
              </h2>
              <p className="text-white/70">Share your moment with the world</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="w-full max-w-sm space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500/20 to-purple-700/20 border-2 border-purple-500/30 hover:border-purple-400 hover:scale-[1.02] transition-all p-8"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-purple-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xl font-bold text-white mb-1">Choose from Gallery</p>
                    <p className="text-sm text-white/60">Max 500MB • MP4, MOV</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => toast({ title: 'Coming soon!', description: 'Camera recording will be available in the next update' })}
                className="w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500/20 to-pink-700/20 border-2 border-pink-500/30 hover:border-pink-400 hover:scale-[1.02] transition-all p-8"
              >
                <div className="flex items-center gap-6">
                  <div className="p-4 bg-pink-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                    <Camera className="h-8 w-8 text-pink-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xl font-bold text-white mb-1">Record Video</p>
                    <p className="text-sm text-white/60">Up to 90s • Coming Soon</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Edit Video */}
        {step === 'edit' && videoPreview && (
          <div className="h-full flex flex-col bg-black">
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 pb-20">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setStep('select');
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
                <Button
                  onClick={() => setStep('publish')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6"
                >
                  Next
                </Button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <video
                ref={videoRef}
                src={videoPreview}
                className="w-full h-full object-contain"
                style={{ filter: filters.find(f => f.id === selectedFilter)?.css }}
                controls
                playsInline
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent p-4 pt-12">
              {/* Speed Control */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">Speed</span>
                  <span className="text-white/60 text-sm">{playbackSpeed}x</span>
                </div>
                <div className="flex items-center gap-3">
                  {[0.5, 1, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange([speed])}
                      className={cn(
                        "flex-1 py-2 rounded-full text-sm font-medium transition-all",
                        playbackSpeed === speed
                          ? "bg-white text-black"
                          : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div className="mb-4">
                <p className="text-white text-sm font-medium mb-2">Filters</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className="flex-shrink-0 flex flex-col items-center gap-2"
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                          selectedFilter === filter.id
                            ? "border-white scale-110"
                            : "border-white/30 hover:border-white/50"
                        )}
                      >
                        <video
                          src={videoPreview}
                          className="w-full h-full object-cover"
                          style={{ filter: filter.css }}
                          muted
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium transition-all",
                          selectedFilter === filter.id
                            ? "text-white"
                            : "text-white/60"
                        )}
                      >
                        {filter.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Publish */}
        {step === 'publish' && videoPreview && (
          <div className="h-full flex flex-col bg-black">
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4 pb-20">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStep('edit')}
                  className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
              <video
                src={videoPreview}
                className="w-full h-full object-contain"
                style={{ filter: filters.find(f => f.id === selectedFilter)?.css }}
                loop
                autoPlay
                muted
                playsInline
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black via-black/95 to-transparent p-4 pt-12">
              <div className="space-y-4">
                <Input
                  placeholder="Write a caption... Add #hashtags"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={500}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 rounded-full px-4 py-6 text-base focus:bg-white/20 focus:border-white/40"
                />

                <Button
                  onClick={handlePublish}
                  disabled={uploading}
                  className="w-full h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Share Reel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
