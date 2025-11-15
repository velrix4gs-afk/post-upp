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
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to update your profile',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Remove read-only fields
      const { is_verified, created_at, updated_at, ...safeUpdates } = updates as any;
      
      // Use the profiles edge function for updates
      const { error } = await supabase.functions.invoke('profiles', {
        method: 'PUT',
        body: safeUpdates
      });

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, ...safeUpdates } : null);
      
      // Refetch to ensure we have the latest data
      await fetchProfile();
      
      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved successfully'
      });
    } catch (err: any) {
      console.error('Profile update failed:', err);
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update your profile. Please try again.',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const uploadCover = async (file: File) => {
    if (!user) {
      toast({
        title: 'AUTH_001',
        description: 'You must be logged in to upload a cover image',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('UPLOAD_004: File size must be less than 5MB');
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('UPLOAD_005: File must be an image');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log('[COVER] Uploading to path:', filePath);
      
      // Delete old cover if exists
      if (profile?.cover_url) {
        const oldPath = profile.cover_url.split('/covers/').pop();
        if (oldPath) {
          console.log('[COVER] Removing old cover:', oldPath);
          await supabase.storage.from('covers').remove([oldPath]);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('[COVER] Upload error:', uploadError);
        throw new Error(`UPLOAD_006: ${uploadError.message}`);
      }

      console.log('[COVER] Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      console.log('[COVER] Public URL:', publicUrl);

      await updateProfile({ cover_url: publicUrl });
      
      toast({
        title: 'Success',
        description: 'Cover image updated successfully!'
      });
      
      return publicUrl;
    } catch (err: any) {
      console.error('[COVER] Error:', err);
      const errorCode = err.message?.split(':')[0] || 'UPLOAD_ERROR';
      const errorMsg = err.message?.split(':')[1]?.trim() || err.message || 'Failed to upload cover image';
      
      toast({
        title: errorCode,
        description: errorMsg,
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
    uploadCover,
    refetch: fetchProfile
  };
};