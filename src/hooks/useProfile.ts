import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  location?: string;
  website?: string;
  birth_date?: string;
  gender?: string;
  phone?: string;
  relationship_status?: string;
  theme_color?: string;
  is_private: boolean;
  is_verified: boolean;
  online_status?: boolean;
  status_message?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = (userId?: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
    }
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Refetch to ensure we have the latest data
      await fetchProfile();
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) {
      toast({
        title: 'AUTH_001',
        description: 'You must be logged in to upload a profile picture',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('UPLOAD_001: File size must be less than 5MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('UPLOAD_002: File must be an image');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('[AVATAR] Uploading to path:', filePath);
      
      // Delete old avatar if exists
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/').pop();
        if (oldPath) {
          console.log('[AVATAR] Removing old avatar:', oldPath);
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('[AVATAR] Upload error:', uploadError);
        throw new Error(`UPLOAD_003: ${uploadError.message}`);
      }

      console.log('[AVATAR] Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('[AVATAR] Public URL:', publicUrl);

      await updateProfile({ avatar_url: publicUrl });
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!'
      });
      
      return publicUrl;
    } catch (err: any) {
      console.error('[AVATAR] Error:', err);
      const errorCode = err.message?.split(':')[0] || 'UPLOAD_ERROR';
      const errorMsg = err.message?.split(':')[1]?.trim() || err.message || 'Failed to upload profile picture';
      
      toast({
        title: errorCode,
        description: errorMsg,
        variant: 'destructive'
      });
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  };
};