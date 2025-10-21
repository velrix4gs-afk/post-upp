import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Image, 
  Video, 
  Smile, 
  MapPin, 
  Users,
  X,
  BarChart3,
  Save,
  Clock
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useDrafts } from "@/hooks/useDrafts";
import { useHashtags } from "@/hooks/useHashtags";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import CreatePollDialog from "./CreatePollDialog";
import DraftsDialog from "./DraftsDialog";

const CreatePost = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { createPost } = usePosts();
  const { saveDraft } = useDrafts();
  const { processHashtags } = useHashtags();
  const [postContent, setPostContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [location, setLocation] = useState('');
  const [taggedUsers, setTaggedUsers] = useState<string[]>([]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate max 10 images
    if (selectedImages.length + files.length > 10) {
      toast({
        title: '[POST_001] Too many images',
        description: 'You can upload maximum 10 images per post',
        variant: 'destructive'
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: '[POST_002] Invalid file type',
          description: `${file.name} is not an image or video`,
          variant: 'destructive'
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: '[POST_003] File too large',
          description: `${file.name} exceeds 10MB limit`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPostMedia = async (files: File[]): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file);

        if (uploadError) {
          console.error('[POST_004] Upload error:', uploadError);
          throw new Error(`[POST_004] Failed to upload ${file.name}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }
      
      return uploadedUrls;
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: error.message || 'Failed to upload images',
        variant: 'destructive'
      });
      return [];
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() && selectedImages.length === 0) {
      toast({
        title: '[POST_005] Missing content',
        description: 'Please add some content or media to your post',
        variant: 'destructive'
      });
      return;
    }

    setIsPosting(true);
    try {
      let mediaUrls: string[] = [];
      if (selectedImages.length > 0) {
        mediaUrls = await uploadPostMedia(selectedImages);
        if (mediaUrls.length === 0 && selectedImages.length > 0) {
          setIsPosting(false);
          return;
        }
      }

      const postData: any = {
        privacy: 'public'
      };
      
      if (postContent.trim()) {
        postData.content = postContent.trim();
      }
      
      if (mediaUrls.length > 0) {
        if (mediaUrls.length === 1) {
          postData.media_url = mediaUrls[0];
          postData.media_type = selectedImages[0].type.startsWith('image/') ? 'image' : 'video';
        } else {
          postData.media_urls = mediaUrls;
          postData.media_type = 'multiple';
        }
      }

      if (location.trim()) {
        postData.location = location.trim();
      }

      if (taggedUsers.length > 0) {
        postData.tagged_users = taggedUsers;
      }

      if (scheduledDate) {
        postData.scheduled_for = scheduledDate.toISOString();
      }

      const newPostId = await createPost(postData);
      setCreatedPostId(newPostId);

      // Process hashtags
      if (postContent.trim()) {
        await processHashtags(newPostId, postContent);
      }

      toast({
        title: 'Success!',
        description: scheduledDate ? 'Post scheduled successfully' : 'Post created successfully'
      });

      // If poll dialog should be shown, keep expanded
      if (!showPollDialog) {
        // Reset form
        setPostContent("");
        setSelectedImages([]);
        setPreviewImages([]);
        setLocation('');
        setTaggedUsers([]);
        setIsExpanded(false);
        setScheduledDate(undefined);
      }
    } catch (error: any) {
      console.error('[POST_006] Post creation error:', error);
      toast({
        title: '[POST_006] Error creating post',
        description: error.message || 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!postContent.trim() && selectedImages.length === 0) return;
    
    let mediaUrls: string[] = [];
    if (selectedImages.length > 0) {
      mediaUrls = await uploadPostMedia(selectedImages);
    }

    await saveDraft({
      content: postContent.trim(),
      media_url: mediaUrls[0] || null,
      media_type: selectedImages[0]?.type.startsWith('image/') ? 'image' : 'video',
      scheduled_for: scheduledDate?.toISOString()
    });

    // Reset form
    setPostContent("");
    setSelectedImages([]);
    setPreviewImages([]);
    setLocation('');
    setTaggedUsers([]);
    setIsExpanded(false);
    setScheduledDate(undefined);
  };

  const handleLoadDraft = (draft: any) => {
    setPostContent(draft.content || '');
    if (draft.media_url) {
      setPreviewImages([draft.media_url]);
    }
    if (draft.scheduled_for) {
      setScheduledDate(new Date(draft.scheduled_for));
    }
    setIsExpanded(true);
  };

  return (
    <Card className="bg-gradient-card border-0 shadow-sm">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-gradient-primary text-white text-sm">
              {profile?.display_name?.split(' ').map(n => n[0]).join('') || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder={`What's on your mind, ${profile?.display_name?.split(' ')[0] || 'there'}?`}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="border-0 bg-muted/50 resize-none focus-visible:ring-primary min-h-[60px]"
              rows={isExpanded ? 3 : 2}
            />
          </div>
        </div>

        {/* Images Preview */}
        {previewImages.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            previewImages.length === 1 ? 'grid-cols-1' :
            previewImages.length === 2 ? 'grid-cols-2' :
            previewImages.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {previewImages.map((preview, index) => (
              <div key={index} className="relative">
                <img 
                  src={preview} 
                  alt={`Preview ${index + 1}`} 
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="relative">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                multiple
              />
              <label htmlFor="image-upload">
                <Button variant="ghost" size="sm" className="h-9 px-3 cursor-pointer" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2 text-success" />
                    <span className="text-xs">Photo/Video {selectedImages.length > 0 && `(${selectedImages.length})`}</span>
                  </span>
                </Button>
              </label>
            </div>

            <Button variant="ghost" size="sm" className="h-9 px-3">
              <Smile className="h-4 w-4 mr-2 text-warning" />
              <span className="text-xs">Feeling</span>
            </Button>

            {isExpanded && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-xs">{location || 'Location'}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Input
                      placeholder="Add location..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </PopoverContent>
                </Popover>

                <Button variant="ghost" size="sm" className="h-9 px-3">
                  <Users className="h-4 w-4 mr-2 text-accent" />
                  <span className="text-xs">Tag {taggedUsers.length > 0 && `(${taggedUsers.length})`}</span>
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 px-3"
                  onClick={() => setShowPollDialog(true)}
                >
                  <BarChart3 className="h-4 w-4 mr-2 text-info" />
                  <span className="text-xs">Poll</span>
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 px-3">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-xs">Schedule</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {isExpanded && (
              <>
                <DraftsDialog onSelectDraft={handleLoadDraft} />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={!postContent.trim() && selectedImages.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              </>
            )}
            <Button 
              size="sm" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              disabled={(!postContent.trim() && selectedImages.length === 0) || isPosting}
              onClick={handlePost}
            >
              {isPosting ? 'Posting...' : scheduledDate ? 'Schedule' : 'Post'}
            </Button>
          </div>
        </div>

        {showPollDialog && createdPostId && (
          <CreatePollDialog 
            postId={createdPostId}
            onPollCreated={() => {
              setShowPollDialog(false);
              setPostContent("");
              setSelectedImages([]);
              setPreviewImages([]);
              setLocation('');
              setTaggedUsers([]);
              setIsExpanded(false);
              setCreatedPostId(null);
            }}
          />
        )}
      </div>
    </Card>
  );
};

export default CreatePost;