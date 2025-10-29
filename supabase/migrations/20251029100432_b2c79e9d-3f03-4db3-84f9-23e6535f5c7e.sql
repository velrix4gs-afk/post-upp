-- Fix messages table to allow null content (for media-only messages)
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;

-- Add check constraint to ensure at least content or media_url exists
ALTER TABLE public.messages 
ADD CONSTRAINT messages_content_or_media_check 
CHECK (content IS NOT NULL OR media_url IS NOT NULL);