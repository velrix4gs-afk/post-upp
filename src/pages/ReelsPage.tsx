import { useState, useRef, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { BackNavigation } from '@/components/BackNavigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, MoreVertical, Music, X, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// Placeholder until types regenerate
interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  caption?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  user: {
    display_name: string;
    username: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

const ReelsPage = () => {
  const [reels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const videoHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / videoHeight);
      
      if (newIndex !== currentIndex && newIndex < reels.length) {
        setCurrentIndex(newIndex);
      }
    };

    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [currentIndex, reels.length]);

  useEffect(() => {
    // Auto-play current video, pause others
    videoRefs.current.forEach((video, index) => {
      if (index === currentIndex) {
        video?.play();
      } else {
        video?.pause();
      }
    });
  }, [currentIndex]);

  const handleLike = (reelId: string) => {
    toast({ description: '❤️ Liked!' });
  };

  const handleShare = (reelId: string) => {
    toast({ description: 'Share feature coming soon!' });
  };

  const handleCreateReel = async () => {
    if (!videoFile) {
      toast({ description: 'Please select a video', variant: 'destructive' });
      return;
    }

    // Validate duration (15-60 seconds)
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (video.duration < 15 || video.duration > 60) {
        toast({ 
          description: 'Video must be between 15-60 seconds', 
          variant: 'destructive' 
        });
        return;
      }

      toast({ description: '🎥 Reel posted successfully!' });
      setCreateDialogOpen(false);
      setVideoFile(null);
      setCaption('');
    };
    video.src = URL.createObjectURL(videoFile);
  };

  return (
    <div className="h-screen bg-black overflow-hidden">
      <Navigation />
      <BackNavigation title="Reels" />
      
      {/* Empty State */}
      {reels.length === 0 && (
        <div className="h-full flex items-center justify-center">
          <Card className="p-8 text-center max-w-md mx-4">
            <div className="mb-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">No Reels Yet</h2>
              <p className="text-muted-foreground">
                Be the first to create a reel! Share your moments in vertical video format.
              </p>
            </div>
            
            <Button 
              size="lg" 
              className="w-full bg-gradient-primary"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Upload className="h-5 w-5 mr-2" />
              Create Your First Reel
            </Button>
          </Card>
        </div>
      )}

      {/* Reels Feed */}
      {reels.length > 0 && (
        <div
          ref={containerRef}
          className="h-full overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              className="relative h-screen w-full snap-start snap-always"
            >
              <video
                ref={el => videoRefs.current[index] = el}
                src={reel.video_url}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted={false}
              />

              {/* Overlay UI */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60">
                {/* Top Bar */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <h1 className="text-white font-bold text-xl">Reels</h1>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-20 left-4 right-20">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white">
                      <AvatarImage src={reel.user.avatar_url} />
                      <AvatarFallback>{reel.user.display_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-white font-semibold">{reel.user.display_name}</p>
                        {reel.user.is_verified && (
                          <Badge variant="secondary" className="h-4 w-4 p-0 bg-primary">
                            ✓
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/80 text-sm">@{reel.user.username}</p>
                    </div>
                    <Button size="sm" variant="secondary" className="ml-2">
                      Follow
                    </Button>
                  </div>

                  {reel.caption && (
                    <p className="text-white text-sm mb-2">{reel.caption}</p>
                  )}
                  
                  <div className="flex items-center gap-3 text-white/80 text-sm">
                    <span>{reel.views_count.toLocaleString()} views</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-24 right-4 flex flex-col gap-4">
                  <button
                    onClick={() => handleLike(reel.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Heart className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-semibold">
                      {reel.likes_count}
                    </span>
                  </button>

                  <button className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-white text-xs font-semibold">
                      {reel.comments_count}
                    </span>
                  </button>

                  <button
                    onClick={() => handleShare(reel.id)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                  </button>

                  <button className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MoreVertical className="h-6 w-6 text-white" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Reel Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Reel</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Video (15-60 seconds)</Label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="hidden"
                id="reel-video"
              />
              <label htmlFor="reel-video">
                <Card className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors text-center">
                  {videoFile ? (
                    <div>
                      <video 
                        src={URL.createObjectURL(videoFile)} 
                        className="w-full max-h-40 object-contain mb-2"
                      />
                      <p className="text-sm text-muted-foreground">{videoFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload video
                      </p>
                    </div>
                  )}
                </Card>
              </label>
            </div>

            <div>
              <Label>Caption (optional)</Label>
              <Textarea
                placeholder="Describe your reel..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {caption.length}/200
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-primary"
                onClick={handleCreateReel}
                disabled={!videoFile}
              >
                Post Reel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReelsPage;
