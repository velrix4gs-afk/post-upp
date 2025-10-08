-- Add polls tables
CREATE TABLE IF NOT EXISTS public.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  allow_multiple boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_text text NOT NULL,
  votes_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id uuid REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls policies
CREATE POLICY "Users can view polls on visible posts"
  ON public.polls FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = polls.post_id
  ));

CREATE POLICY "Users can create polls for their posts"
  ON public.polls FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = polls.post_id AND posts.user_id = auth.uid()
  ));

-- Poll options policies
CREATE POLICY "Users can view poll options"
  ON public.poll_options FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.posts po ON po.id = p.post_id
    WHERE p.id = poll_options.poll_id
  ));

CREATE POLICY "Users can create poll options for their polls"
  ON public.poll_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.posts po ON po.id = p.post_id
    WHERE p.id = poll_options.poll_id AND po.user_id = auth.uid()
  ));

-- Poll votes policies
CREATE POLICY "Users can view poll votes"
  ON public.poll_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.posts po ON po.id = p.post_id
    WHERE p.id = poll_votes.poll_id
  ));

CREATE POLICY "Users can vote on polls"
  ON public.poll_votes FOR INSERT
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.polls p
    JOIN public.posts po ON po.id = p.post_id
    WHERE p.id = poll_votes.poll_id
  ));

CREATE POLICY "Users can delete their votes"
  ON public.poll_votes FOR DELETE
  USING (user_id = auth.uid());

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_poll_option_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.poll_options 
    SET votes_count = votes_count + 1 
    WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.poll_options 
    SET votes_count = votes_count - 1 
    WHERE id = OLD.option_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for vote counts
CREATE TRIGGER update_poll_votes_count
  AFTER INSERT OR DELETE ON public.poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_option_votes();