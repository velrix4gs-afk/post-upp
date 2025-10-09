-- Create groups table
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  privacy text NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
  avatar_url text,
  cover_url text,
  created_by uuid NOT NULL,
  member_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_posts table
CREATE TABLE public.group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, post_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Public groups viewable by everyone"
  ON public.groups FOR SELECT
  USING (
    privacy = 'public' OR 
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete groups"
  ON public.groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group members policies
CREATE POLICY "Members viewable by group members"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND (
        g.privacy = 'public' OR
        g.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.group_members gm
          WHERE gm.group_id = g.id AND gm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.groups 
      WHERE id = group_members.group_id AND privacy = 'public'
    )
  );

CREATE POLICY "Admins can manage members"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

CREATE POLICY "Users can leave or admins can remove"
  ON public.group_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );

-- Group posts policies
CREATE POLICY "Group posts viewable by members"
  ON public.group_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_posts.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can add posts"
  ON public.group_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_posts.group_id AND user_id = auth.uid()
    )
  );

-- Create storage bucket for group images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for group images
CREATE POLICY "Group images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'group-images');

CREATE POLICY "Authenticated users can upload group images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'group-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update group images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'group-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete group images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'group-images' AND
    auth.uid() IS NOT NULL
  );

-- Trigger to update groups.updated_at
CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();