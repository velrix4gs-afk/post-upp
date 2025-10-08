import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Image, 
  Video, 
  Smile, 
  MapPin, 
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const CreatePost = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { createPost } = usePosts();
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: 'Error',
          description: 'Please select an image or video file',
          variant: 'destructive'
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const uploadPostMedia = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive'
      });
      return null;
    }
  };

  const handlePost = async () => {
    if (!postContent.trim() && !selectedFile) {
      toast({
        title: 'Error',
        description: 'Please add some content or media to your post',
        variant: 'destructive'
      });
      return;
    }

    setIsPosting(true);
    try {
      let mediaUrl = null;
      if (selectedFile) {
        mediaUrl = await uploadPostMedia(selectedFile);
        if (!mediaUrl) {
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
      
      if (mediaUrl) {
        postData.media_url = mediaUrl;
        postData.media_type = selectedFile!.type.startsWith('image/') ? 'image' : 'video';
      }

      await createPost(postData);

      // Reset form
      setPostContent("");
      setSelectedImage(null);
      setSelectedFile(null);
      setIsExpanded(false);
    } catch (error: any) {
      console.error('Post creation error:', error);
    } finally {
      setIsPosting(false);
    }
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

        {/* Image Preview */}
        {selectedImage && (
          <div className="relative mb-4">
            <img 
              src={selectedImage} 
              alt="Upload preview" 
              className="w-full max-h-64 object-cover rounded-lg"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button variant="ghost" size="sm" className="h-9 px-3 cursor-pointer" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2 text-success" />
                    <span className="text-xs">Photo/Video</span>
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
                <Button variant="ghost" size="sm" className="h-9 px-3">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  <span className="text-xs">Location</span>
                </Button>

                <Button variant="ghost" size="sm" className="h-9 px-3">
                  <Users className="h-4 w-4 mr-2 text-accent" />
                  <span className="text-xs">Tag</span>
                </Button>
              </>
            )}
          </div>

          <Button 
            size="sm" 
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            disabled={(!postContent.trim() && !selectedImage) || isPosting}
            onClick={handlePost}
          >
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CreatePost;