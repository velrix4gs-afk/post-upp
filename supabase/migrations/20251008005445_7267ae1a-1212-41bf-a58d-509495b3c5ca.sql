-- Add unique constraint to prevent duplicate reactions
ALTER TABLE public.post_reactions 
ADD CONSTRAINT post_reactions_user_post_unique 
UNIQUE (user_id, post_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_post 
ON public.post_reactions(user_id, post_id);