import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MediaFile {
  id: string;
  url: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
}

export interface UploadProgress {
  file: File;
  progress: number;
  uploading: boolean;
  error?: string;
  mediaId?: string;
}

export const useMedia = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({});
  const { toast } = useToast();

  const uploadMedia = async (files: File[]): Promise<MediaFile[]> => {
    const uploadedMedia: MediaFile[] = [];
    
    for (const file of files) {
      const fileKey = `${file.name}-${file.size}`;
      
      try {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          throw new Error('Only images and videos are supported');
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }

        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: { file, progress: 0, uploading: true }
        }));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: { ...prev[fileKey], progress: 50 }
        }));

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(uploadData.path);

        // Get image dimensions if it's an image
        let width, height;
        if (file.type.startsWith('image/')) {
          const dimensions = await getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        }

        // Create media record
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .insert({
            user_id: user.id,
            url: publicUrl,
            mime: file.type,
            size: file.size,
            width,
            height
          })
          .select()
          .single();

        if (mediaError) throw mediaError;

        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: { ...prev[fileKey], progress: 100, uploading: false, mediaId: mediaData.id }
        }));

        uploadedMedia.push({
          id: mediaData.id,
          url: publicUrl,
          mime: file.type,
          size: file.size,
          width,
          height
        });
      } catch (error: any) {
        console.error('Error uploading media:', error);
        setUploadProgress(prev => ({
          ...prev,
          [fileKey]: { ...prev[fileKey], uploading: false, error: error.message }
        }));
        
        toast({
          title: "Upload Error",
          description: error.message,
          variant: "destructive"
        });
      }
    }

    return uploadedMedia;
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const clearProgress = () => {
    setUploadProgress({});
  };

  return {
    uploadMedia,
    uploadProgress,
    clearProgress
  };
};
