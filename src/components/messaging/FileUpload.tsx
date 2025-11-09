import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Paperclip, Image, Video, Music, FileText, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File, type: 'image' | 'video' | 'audio' | 'document') => void;
}

export const FileUpload = ({ onFileSelect }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'audio' | 'document' | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'document') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // File size validation (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setFileType(type);

    if (type === 'image' || type === 'video') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPreview(true);
    } else {
      onFileSelect(file, type);
    }
  };

  const confirmSelection = () => {
    if (selectedFile && fileType) {
      onFileSelect(selectedFile, fileType);
      handleClose();
    }
  };

  const handleClose = () => {
    setShowPreview(false);
    setSelectedFile(null);
    setFileType(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Paperclip className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <label className="cursor-pointer">
              <Image className="h-4 w-4 mr-2" />
              <span>Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'image')}
              />
            </label>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <label className="cursor-pointer">
              <Video className="h-4 w-4 mr-2" />
              <span>Video</span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'video')}
              />
            </label>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <label className="cursor-pointer">
              <Music className="h-4 w-4 mr-2" />
              <span>Audio</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'audio')}
              />
            </label>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <label className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              <span>Document</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                className="hidden"
                onChange={(e) => handleFileChange(e, 'document')}
              />
            </label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showPreview} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Preview</span>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {fileType === 'image' && (
              <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
            )}
            
            {fileType === 'video' && (
              <video src={previewUrl} controls className="w-full rounded-lg" />
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={confirmSelection}>Send</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
