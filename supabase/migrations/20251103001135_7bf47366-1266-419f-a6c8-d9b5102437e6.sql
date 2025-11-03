-- Create pages table
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  website_url TEXT,
  contact_email TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Create page_followers table
CREATE TABLE IF NOT EXISTS public.page_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.page_followers ENABLE ROW LEVEL SECURITY;

-- Create event_collaborators table
CREATE TABLE IF NOT EXISTS public.event_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'collaborator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_collaborators ENABLE ROW LEVEL SECURITY;

-- Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pages
CREATE POLICY "Pages are viewable by everyone"
  ON public.pages FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own pages"
  ON public.pages FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Page creators can update their pages"
  ON public.pages FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Page creators can delete their pages"
  ON public.pages FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for page_followers
CREATE POLICY "Page followers are viewable by everyone"
  ON public.page_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow pages"
  ON public.page_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow pages"
  ON public.page_followers FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for event_collaborators
CREATE POLICY "Event collaborators are viewable by everyone"
  ON public.event_collaborators FOR SELECT
  USING (true);

CREATE POLICY "Event creators can add collaborators"
  ON public.event_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND created_by = auth.uid()
    )
  );

CREATE POLICY "Event creators can remove collaborators"
  ON public.event_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id AND created_by = auth.uid()
    )
  );

-- RLS Policies for profile_views
CREATE POLICY "Users can view their own profile views"
  ON public.profile_views FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Anyone can insert profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

-- Update trigger for pages
CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update page followers count
CREATE OR REPLACE FUNCTION public.update_page_followers_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pages 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.page_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pages 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.page_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_page_followers_count_trigger
  AFTER INSERT OR DELETE ON public.page_followers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_page_followers_count();

-- Add admin role to group_members if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'group_members' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.group_members ADD COLUMN role TEXT DEFAULT 'member';
  END IF;
END $$;

-- Update group creator to be admin
CREATE OR REPLACE FUNCTION public.make_group_creator_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'admin';
  RETURN NEW;
END;
$$;

CREATE TRIGGER make_group_creator_admin_trigger
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.make_group_creator_admin();