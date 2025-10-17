-- Add missing columns to user_settings table for comprehensive settings
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS font_size text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS layout_mode text DEFAULT 'spacious',
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS privacy_who_can_tag text DEFAULT 'everyone',
ADD COLUMN IF NOT EXISTS location_sharing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS show_read_receipts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_typing_indicator boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS autoplay_videos boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_sensitive_content boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_post_comments boolean DEFAULT true;

-- Add is_active column to profiles for account deactivation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

COMMENT ON COLUMN public.user_settings.font_size IS 'User preferred font size: small, medium, large';
COMMENT ON COLUMN public.user_settings.layout_mode IS 'Layout preference: compact, spacious';
COMMENT ON COLUMN public.user_settings.accent_color IS 'User preferred accent color';
COMMENT ON COLUMN public.profiles.is_active IS 'Account active status for deactivation feature';