import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStories } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Plus, Camera, Video, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerificationBadge } from '@/components/premium/VerificationBadge';
import { ProfileHoverCard } from '@/components/ProfileHoverCard';
const Stories = () => {
  const {
    user
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    stories,
    createStory,
    viewStory,
    deleteStory
  } = useStories();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const preview = URL.createObjectURL(file);
    setMediaPreview(preview);
  };
  const handleCreateStory = async () => {
    if (!content.trim() && !mediaFile) return;
    await createStory(content, mediaFile || undefined);
    setCreateDialogOpen(false);
    setContent('');
    setMediaFile(null);
    setMediaPreview(null);
  };
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
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <div className="flex-shrink-0 w-[72px] text-center cursor-pointer">
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
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">What's on your mind?</Label>
                  <Input id="content" placeholder="Share something..." value={content} onChange={e => setContent(e.target.value)} />
                </div>
                
                {mediaPreview && <div className="relative">
                    {mediaFile?.type.startsWith('video/') ? <video src={mediaPreview} className="w-full h-48 object-cover rounded" controls /> : <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover rounded" />}
                    <Button size="sm" variant="destructive" className="absolute top-2 right-2" onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>}
                
                <div className="flex space-x-2">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Photo
                      </span>
                    </Button>
                  </Label>
                  <input id="photo-upload" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  
                  <Label htmlFor="video-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </span>
                    </Button>
                  </Label>
                  <input id="video-upload" type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                </div>
                
                <Button onClick={handleCreateStory} className="w-full">
                  Share Story
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
          <DialogContent className="max-w-md p-0">
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
                      {formatDistanceToNow(new Date(selectedStory.created_at), {
                    addSuffix: true
                  })}
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
              
              <div className="aspect-[9/16] flex items-center justify-center bg-black">
                {selectedStory.media_url ? selectedStory.media_type === 'video' ? <video src={selectedStory.media_url} className="w-full h-full object-cover" controls autoPlay /> : <img src={selectedStory.media_url} alt="Story" className="w-full h-full object-cover" /> : <div className="p-6 text-center">
                    <p className="text-white text-lg">{selectedStory.content}</p>
                  </div>}
              </div>
            </div>
          </DialogContent>
        </Dialog>}
    </>;
};
export default Stories;