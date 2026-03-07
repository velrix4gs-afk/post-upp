
-- 1. Create page_members table for role management
CREATE TABLE public.page_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'admin', 'editor', 'moderator')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(page_id, user_id)
);

ALTER TABLE public.page_members ENABLE ROW LEVEL SECURITY;

-- RLS: everyone can view page members
CREATE POLICY "Anyone can view page members"
  ON public.page_members FOR SELECT
  USING (true);

-- RLS: page owner/admin can manage members
CREATE POLICY "Page owner/admin can insert members"
  ON public.page_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.page_members pm
      WHERE pm.page_id = page_members.page_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM public.pages p
      WHERE p.id = page_members.page_id
        AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Page owner/admin can update members"
  ON public.page_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.page_members pm
      WHERE pm.page_id = page_members.page_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Page owner/admin can delete members"
  ON public.page_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.page_members pm
      WHERE pm.page_id = page_members.page_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'admin')
    )
  );

-- 2. Add page_id column to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL;

-- 3. Security definer function to check page membership
CREATE OR REPLACE FUNCTION public.is_page_member(_page_id uuid, _user_id uuid, _roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.page_members
    WHERE page_id = _page_id
      AND user_id = _user_id
      AND (_roles IS NULL OR role = ANY(_roles))
  )
$$;

-- 4. Trigger to auto-add page creator as owner in page_members
CREATE OR REPLACE FUNCTION public.auto_add_page_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.page_members (page_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT (page_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_add_page_owner
  AFTER INSERT ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_add_page_owner();
