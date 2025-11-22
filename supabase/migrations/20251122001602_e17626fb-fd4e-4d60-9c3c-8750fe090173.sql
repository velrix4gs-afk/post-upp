-- Priority 1 & 2: Database schema for all features

-- 1. Pinned posts
CREATE TABLE IF NOT EXISTS pinned_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_pinned_posts_user ON pinned_posts(user_id);
ALTER TABLE pinned_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can pin their own posts"
  ON pinned_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view pinned posts"
  ON pinned_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can unpin their own posts"
  ON pinned_posts FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Story highlights
CREATE TABLE IF NOT EXISTS story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID REFERENCES story_highlights(id) ON DELETE CASCADE NOT NULL,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(highlight_id, story_id)
);

CREATE INDEX idx_story_highlights_user ON story_highlights(user_id);
CREATE INDEX idx_story_highlight_items_highlight ON story_highlight_items(highlight_id);

ALTER TABLE story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_highlight_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own highlights"
  ON story_highlights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view highlights"
  ON story_highlights FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their highlight items"
  ON story_highlight_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM story_highlights 
    WHERE id = highlight_id AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM story_highlights 
    WHERE id = highlight_id AND user_id = auth.uid()
  ));

CREATE POLICY "Anyone can view highlight items"
  ON story_highlight_items FOR SELECT
  USING (true);

-- 3. Geolocation for posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS longitude FLOAT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_name TEXT;

CREATE INDEX idx_posts_location ON posts(latitude, longitude) WHERE latitude IS NOT NULL;

-- 4. Pinned content (reels)
CREATE TABLE IF NOT EXISTS pinned_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'reel')),
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id, content_type)
);

CREATE INDEX idx_pinned_content_user ON pinned_content(user_id);
ALTER TABLE pinned_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can pin their own content"
  ON pinned_content FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view pinned content"
  ON pinned_content FOR SELECT
  USING (true);

-- 5. Spam reports
CREATE TABLE IF NOT EXISTS spam_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'user')),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_spam_reports_content ON spam_reports(content_id, content_type);
CREATE INDEX idx_spam_reports_status ON spam_reports(status);
ALTER TABLE spam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report content"
  ON spam_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON spam_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- 6. Content moderation filters
CREATE TABLE IF NOT EXISTS moderation_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('flag', 'block', 'warn')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_moderation_filters_active ON moderation_filters(is_active);
ALTER TABLE moderation_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage filters"
  ON moderation_filters FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));