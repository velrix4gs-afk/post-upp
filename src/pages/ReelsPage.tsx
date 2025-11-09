import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Upload, Video } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Placeholder until Supabase types regenerate with new tables
const ReelsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Video must be less than 100MB',
        variant: 'destructive',
      });
      return;
    }

    setVideoFile(file);
  };

  const handleCreateReel = async () => {
    if (!videoFile) return;

    toast({
      title: 'Feature Coming Soon',
      description: 'Reels will be fully functional once database types regenerate from the new tables.',
    });

    setCreateDialogOpen(false);
    setVideoFile(null);
    setCaption('');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Video className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Reels Coming Soon</h2>
            <p className="text-muted-foreground mb-4">
              The reels feature has been set up and is waiting for database types to regenerate.
              Once types update, you'll be able to:
            </p>
            <ul className="text-left text-sm text-muted-foreground space-y-2 mb-6">
              <li>• Create and share vertical video reels</li>
              <li>• Swipe to navigate between reels</li>
              <li>• Like and comment on reels</li>
              <li>• View real-time engagement metrics</li>
            </ul>
          </div>
          
          <Button 
            size="lg" 
            className="w-full bg-gradient-primary"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-5 w-5 mr-2" />
            Preview Create Dialog
          </Button>
        </Card>
      </div>

      {/* Create Reel Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Reel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-upload">Video</Label>
              <div className="mt-2">
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                />
              </div>
              {videoFile && (
                <div className="mt-2">
                  <video
                    src={URL.createObjectURL(videoFile)}
                    className="w-full h-48 object-cover rounded"
                    controls
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {caption.length}/200 characters
              </p>
            </div>

            <Button
              onClick={handleCreateReel}
              disabled={!videoFile}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Post Reel (Preview)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReelsPage;
