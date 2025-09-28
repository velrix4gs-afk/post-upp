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

const Stories = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { stories, createStory, viewStory } = useStories();
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

  return (
    <>
      <Card className="bg-gradient-card border-0 p-4">
        <div className="flex space-x-3 overflow-x-auto pb-2">
          {/* Add Story */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <div className="flex-shrink-0 text-center cursor-pointer">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-dashed border-muted-foreground">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-muted">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <p className="text-xs mt-2 text-muted-foreground">Add Story</p>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">What's on your mind?</Label>
                  <Input
                    id="content"
                    placeholder="Share something..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                
                {mediaPreview && (
                  <div className="relative">
                    {mediaFile?.type.startsWith('video/') ? (
                      <video src={mediaPreview} className="w-full h-48 object-cover rounded" controls />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-48 object-cover rounded" />
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Label htmlFor="photo-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Camera className="h-4 w-4 mr-2" />
                        Photo
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <Label htmlFor="video-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </span>
                    </Button>
                  </Label>
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                <Button onClick={handleCreateStory} className="w-full">
                  Share Story
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Story Items */}
          {stories.map((story) => (
            <div 
              key={story.id} 
              className="flex-shrink-0 text-center cursor-pointer"
              onClick={() => handleStoryClick(story)}
            >
              <Avatar className="h-16 w-16 ring-4 ring-gradient-primary">
                <AvatarImage src={story.profiles.avatar_url} />
                <AvatarFallback className="bg-gradient-primary text-white">
                  {story.profiles.display_name[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs mt-2 max-w-[60px] truncate">
                {story.profiles.display_name}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Story Viewer */}
      {selectedStory && (
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
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
                    <p className="text-white text-sm font-medium">
                      {selectedStory.profiles.display_name}
                    </p>
                    <p className="text-white/70 text-xs">
                      {formatDistanceToNow(new Date(selectedStory.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => setSelectedStory(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="aspect-[9/16] flex items-center justify-center bg-black">
                {selectedStory.media_url ? (
                  selectedStory.media_type === 'video' ? (
                    <video 
                      src={selectedStory.media_url} 
                      className="w-full h-full object-cover" 
                      controls 
                      autoPlay 
                    />
                  ) : (
                    <img 
                      src={selectedStory.media_url} 
                      alt="Story" 
                      className="w-full h-full object-cover" 
                    />
                  )
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-white text-lg">{selectedStory.content}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Stories;