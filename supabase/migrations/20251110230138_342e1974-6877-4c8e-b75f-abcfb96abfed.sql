-- Add voice_calls and video_calls columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS voice_calls boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS video_calls boolean DEFAULT true;