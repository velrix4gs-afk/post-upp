import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Heart, MessageCircle, Share2, MoreVertical, Pause, Play, Volume2, VolumeX, Film, Loader2 } from 'lucide-react';
import { useReels } from '@/hooks/useReels';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BackNavigation } from '@/components/BackNavigation';
import { PremiumBadge } from '@/components/premium/PremiumBadge';

const ReelsPage = () => {
  const { reels, loading, hasMore, fetchReels, createReel, viewReel, likeReel, fetchComments, addComment } = useReels();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const viewTimers = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.play();
      startViewTracking(reels[currentIndex]?.id);
    }

    return () => {
      Object.values(viewTimers.current).forEach(clearTimeout);
    };
  }, [currentIndex, reels]);

  const startViewTracking = (reelId: string) => {
    if (!reelId) return;
    
    const startTime = Date.now();
    viewTimers.current[reelId] = window.setTimeout(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      viewReel(reelId, duration, true);
    }, 3000);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const itemHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      // Pause previous video
      videoRefs.current[currentIndex]?.pause();
      setCurrentIndex(newIndex);
      
      // Load more if near end
      if (newIndex >= reels.length - 2 && hasMore && !loading) {
        fetchReels();
      }
    }
  };

  const togglePlayPause = () => {
    const video = videoRefs.current[currentIndex];
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = async (reelId: string) => {
    await likeReel(reelId);
  };

  const handleShare = (reel: any) => {
    if (navigator.share) {
      navigator.share({
        title: reel.caption || 'Check out this reel!',
        url: window.location.href
      });
    } else {
      toast({ title: 'Link copied!', description: 'Reel link copied to clipboard' });
    }
  };

  const handleOpenComments = async (reelId: string) => {
    const fetchedComments = await fetchComments(reelId);
    setComments(fetchedComments);
    setCommentsOpen(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const reel = reels[currentIndex];
    await addComment(reel.id, newComment);
    
    const updatedComments = await fetchComments(reel.id);
    setComments(updatedComments);
    setNewComment('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      toast({
        title: 'Video too large',
        description: 'Video must be less than 200MB',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    setVideoFile(file);
  };

  const handleCreateReel = async () => {
    if (!videoFile) return;

    setUploading(true);
    try {
      const result = await createReel(videoFile, caption);
      if (result) {
        setCreateDialogOpen(false);
        setVideoFile(null);
        setCaption('');
        fetchReels(true);
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading && reels.length === 0) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading reels...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <BackNavigation />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Film className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Reels Yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to create a reel! Share your moments with the community.
            </p>
            <Button 
              size="lg"
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-primary hover:shadow-glow"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Reel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <BackNavigation />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setCreateDialogOpen(true)}
          className="bg-background/20 backdrop-blur-sm hover:bg-background/30"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Reels Container */}
      <ScrollArea 
        ref={containerRef}
        className="h-full snap-y snap-mandatory"
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="h-screen w-full snap-start snap-always relative flex items-center justify-center bg-black"
          >
            {/* Video */}
            <video
              ref={(el) => (videoRefs.current[index] = el)}
              src={reel.video_url}
              className="h-full w-full object-contain"
              loop
              playsInline
              muted={isMuted}
              onClick={togglePlayPause}
            />

            {/* Play/Pause Overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Play className="h-20 w-20 text-white opacity-80" fill="white" />
              </div>
            )}

            {/* Controls - Right Side */}
            <div className="absolute right-4 bottom-20 flex flex-col items-center gap-6 z-20">
              {/* Creator Avatar */}
              <Avatar className="h-12 w-12 ring-2 ring-background cursor-pointer">
                <AvatarImage src={reel.creator_avatar} />
                <AvatarFallback>{reel.creator_name?.[0]}</AvatarFallback>
              </Avatar>

              {/* Like */}
              <button
                onClick={() => handleLike(reel.id)}
                className="flex flex-col items-center gap-1"
              >
                <Heart
                  className={cn(
                    "h-8 w-8 transition-all",
                    reel.is_liked ? "fill-red-500 text-red-500" : "text-white"
                  )}
                />
                <span className="text-xs text-white font-semibold">
                  {reel.likes_count}
                </span>
              </button>

              {/* Comment */}
              <button
                onClick={() => handleOpenComments(reel.id)}
                className="flex flex-col items-center gap-1"
              >
                <MessageCircle className="h-8 w-8 text-white" />
                <span className="text-xs text-white font-semibold">
                  {reel.comments_count}
                </span>
              </button>

              {/* Share */}
              <button
                onClick={() => handleShare(reel)}
                className="flex flex-col items-center gap-1"
              >
                <Share2 className="h-8 w-8 text-white" />
                <span className="text-xs text-white font-semibold">Share</span>
              </button>

              {/* Mute */}
              <button onClick={toggleMute} className="mt-4">
                {isMuted ? (
                  <VolumeX className="h-6 w-6 text-white" />
                ) : (
                  <Volume2 className="h-6 w-6 text-white" />
                )}
              </button>
            </div>

            {/* Info - Bottom */}
            <div className="absolute left-4 right-20 bottom-20 z-20 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{reel.creator_name}</span>
                {reel.is_verified && <PremiumBadge />}
              </div>
              {reel.caption && (
                <p className="text-sm line-clamp-2">{reel.caption}</p>
              )}
              <p className="text-xs text-white/70 mt-1">
                {reel.views_count.toLocaleString()} views
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="h-screen flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </ScrollArea>

      {/* Create Reel Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-upload">Video *</Label>
              <Input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="mt-2"
              />
              {videoFile && (
                <div className="mt-2">
                  <video
                    src={URL.createObjectURL(videoFile)}
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                placeholder="Add a caption... Use #hashtags to reach more people!"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={500}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {caption.length}/500 characters
              </p>
            </div>

            <Button
              onClick={handleCreateReel}
              disabled={!videoFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Reel
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={commentsOpen} onOpenChange={setCommentsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-96">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No comments yet</p>
                <p className="text-sm">Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user?.avatar_url} />
                      <AvatarFallback>{comment.user?.display_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{comment.user?.display_name}</p>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReelsPage;
