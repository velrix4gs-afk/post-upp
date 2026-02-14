import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerificationBadge } from '@/components/premium/VerificationBadge';
import { ProfileHoverCard } from '@/components/ProfileHoverCard';

const Stories = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { stories, viewStory, deleteStory } = useStories();
  const navigate = useNavigate();
  const [selectedStory, setSelectedStory] = useState<any>(null);

  const handleStoryClick = async (story: any) => {
    await viewStory(story.id);
    setSelectedStory(story);
  };

  const handleDeleteStory = async (storyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteStory(storyId);
    if (selectedStory?.id === storyId) {
      setSelectedStory(null);
    }
  };

  return <>
      {/* Floating stories - no background */}
      <div className="py-3 px-2">
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          {/* Add Story - Floating circle with + */}
          <div className="flex-shrink-0 w-[72px] text-center cursor-pointer" onClick={() => navigate('/create/story')}>
            <div className="relative w-[68px] h-[68px] mx-auto">
              <div className="w-[68px] h-[68px] rounded-full bg-background border-2 border-dashed border-primary/50 flex items-center justify-center hover:border-primary transition-colors">
                {profile?.avatar_url ? (
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {profile?.display_name?.[0] || '+'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Plus className="h-7 w-7 text-primary" />
                )}
              </div>
              {/* Plus badge */}
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <Plus className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
              </div>
            </div>
            <p className="text-[11px] mt-1.5 text-muted-foreground truncate font-medium">Your Story</p>
          </div>

          {/* Story Items - Floating circles */}
          {stories.map(story => <div key={story.id} className="flex-shrink-0 w-[72px] text-center cursor-pointer snap-start relative group" onClick={() => handleStoryClick(story)}>
              <ProfileHoverCard userId={story.user_id}>
                <div className="w-[68px] h-[68px] mx-auto relative">
                  {/* Gradient ring */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
                    <div className="w-full h-full rounded-full bg-background p-[2px]">
                      <Avatar className="w-full h-full">
                        <AvatarImage src={story.profiles.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {story.profiles.display_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  {story.user_id === user?.id && <Button size="sm" variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={e => handleDeleteStory(story.id, e)}>
                      <X className="h-3 w-3" />
                    </Button>}
                </div>
              </ProfileHoverCard>
              <p className="text-[11px] mt-1.5 w-[72px] truncate font-medium">
                {story.profiles.display_name.split(' ')[0]}
              </p>
            </div>)}
        </div>
      </div>

      {/* Story Viewer */}
      {selectedStory && <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-md p-0 [&>button]:hidden">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedStory.profiles.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {selectedStory.profiles.display_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white text-sm font-medium flex items-center gap-1">
                      {selectedStory.profiles.display_name}
                      <VerificationBadge isVerified={selectedStory.profiles.is_verified} />
                    </p>
                    <p className="text-white/70 text-xs">
                      {formatDistanceToNow(new Date(selectedStory.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedStory.user_id === user?.id && <Button size="sm" variant="destructive" className="hover:bg-destructive/90" onClick={e => handleDeleteStory(selectedStory.id, e)}>
                      Delete
                    </Button>}
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setSelectedStory(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="aspect-[9/16] flex items-center justify-center bg-black relative">
                {selectedStory.media_url ? selectedStory.media_type === 'video' ? <video src={selectedStory.media_url} className="w-full h-full object-cover" autoPlay playsInline muted loop onClick={(e) => {
                    const video = e.currentTarget;
                    video.paused ? video.play() : video.pause();
                  }} /> : <img src={selectedStory.media_url} alt="Story" className="w-full h-full object-cover" /> : <div className="p-6 text-center">
                    <p className="text-white text-lg">{selectedStory.content}</p>
                  </div>}
                {selectedStory.media_url && selectedStory.content && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-sm text-center">{selectedStory.content}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>}
    </>;
};
export default Stories;
