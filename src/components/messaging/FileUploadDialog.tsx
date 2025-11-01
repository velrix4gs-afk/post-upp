import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FileIcon, X, Upload } from 'lucide-react';

interface FileUploadDialogProps {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: (url: string, type: string, fileName: string) => void;
}

export const FileUploadDialog = ({ chatId, open, onOpenChange, onUploadComplete }: FileUploadDialogProps) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 50MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    setProgress(0);

    try {
      const fileName = `${user.id}/${chatId}/${Date.now()}-${selectedFile.name}`;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('messages')
        .upload(fileName, selectedFile);

      clearInterval(progressInterval);
      setProgress(100);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('messages')
        .getPublicUrl(fileName);

      onUploadComplete(publicUrl, selectedFile.type, selectedFile.name);
      onOpenChange(false);
      setSelectedFile(null);
      setProgress(0);
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileIcon className="h-12 w-12" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="h-32 w-32 object-cover rounded" />;
    }
    
    return <FileIcon className="h-12 w-12" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedFile ? (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:text-primary/80">Choose a file</span>
                <span className="text-muted-foreground"> or drag and drop</span>
              </Label>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <p className="text-sm text-muted-foreground mt-2">
                Images, videos, documents (max 50MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                {getFileIcon()}
                <div className="flex-1">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Uploading... {progress}%
                  </p>
                </div>
              )}
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
