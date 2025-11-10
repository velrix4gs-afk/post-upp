-- Add notification preference columns to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS likes BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS follows BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS friend_requests BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS mentions BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS shares BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS group_activity BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.user_settings.email_enabled IS 'Enable email notifications';
COMMENT ON COLUMN public.user_settings.sms_enabled IS 'Enable SMS notifications';
COMMENT ON COLUMN public.user_settings.likes IS 'Enable notifications for likes and reactions';
COMMENT ON COLUMN public.user_settings.comments IS 'Enable notifications for comments';
COMMENT ON COLUMN public.user_settings.messages IS 'Enable notifications for direct messages';
COMMENT ON COLUMN public.user_settings.follows IS 'Enable notifications for new followers';
COMMENT ON COLUMN public.user_settings.friend_requests IS 'Enable notifications for friend requests';
COMMENT ON COLUMN public.user_settings.mentions IS 'Enable notifications for mentions';
COMMENT ON COLUMN public.user_settings.shares IS 'Enable notifications for post shares';
COMMENT ON COLUMN public.user_settings.group_activity IS 'Enable notifications for group activity';
