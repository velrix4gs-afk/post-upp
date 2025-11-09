import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Reel {
  id: string;
  user_id: string;
  video_url: string;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface ReelPlayerProps {
  reel: Reel;
  isActive: boolean;
}

const ReelPlayer = ({ reel, isActive }: ReelPlayerProps) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play();
        // Track view after 3 seconds
        const timer = setTimeout(() => {
          if (!viewTracked) {
            trackView();
          }
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isActive]);

  const trackView = async () => {
    if (!user || viewTracked) return;
    
    try {
      // Track view using existing tables
      setViewTracked(true);
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', reel.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_reactions')
          .insert({
            post_id: reel.id,
            user_id: user.id,
            reaction_type: 'like'
          });
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
      setIsPaused(!isPaused);
    }
  };

  return (
    <div className="h-screen w-full relative bg-black snap-start">
      <video
        ref={videoRef}
        src={reel.video_url}
        className="w-full h-full object-contain"
        loop
        playsInline
        onClick={togglePlayPause}
      />

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top gradient */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
        
        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-end justify-between">
            {/* Left: User info and caption */}
            <div className="flex-1 pr-4 pointer-events-auto">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-10 w-10 ring-2 ring-white">
                  <AvatarImage src={reel.profiles?.avatar_url || ''} />
                  <AvatarFallback>{reel.profiles?.display_name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-semibold">
                    {reel.profiles?.display_name}
                  </p>
                  <p className="text-white/80 text-sm">
                    @{reel.profiles?.username}
                  </p>
                </div>
              </div>
              {reel.caption && (
                <p className="text-white text-sm line-clamp-2">{reel.caption}</p>
              )}
            </div>

            {/* Right: Action buttons */}
            <div className="flex flex-col gap-4 pointer-events-auto">
              <button
                onClick={handleLike}
                className="flex flex-col items-center gap-1"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isLiked ? 'bg-red-500' : 'bg-white/20'
                }`}>
                  <Heart 
                    className={`h-6 w-6 ${isLiked ? 'text-white fill-white' : 'text-white'}`} 
                  />
                </div>
                <span className="text-white text-xs font-semibold">
                  {reel.likes_count}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {reel.comments_count}
                </span>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
              </button>

              <button className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <MoreVertical className="h-6 w-6 text-white" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelPlayer;
