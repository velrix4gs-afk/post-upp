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

const CreatePost = () => {
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  return (
    <Card className="bg-gradient-card border-0 shadow-sm">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-10 w-10 ring-2 ring-primary/20">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-gradient-primary text-white text-sm">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind, John?"
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
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button variant="ghost" size="sm" className="h-9 px-3 cursor-pointer" asChild>
                  <span>
                    <Image className="h-4 w-4 mr-2 text-success" />
                    <span className="text-xs">Photo</span>
                  </span>
                </Button>
              </label>
            </div>

            <Button variant="ghost" size="sm" className="h-9 px-3">
              <Video className="h-4 w-4 mr-2 text-destructive" />
              <span className="text-xs">Video</span>
            </Button>

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
            disabled={!postContent.trim() && !selectedImage}
          >
            Post
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default CreatePost;