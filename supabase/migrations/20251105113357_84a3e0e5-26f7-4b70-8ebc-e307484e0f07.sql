
-- Verification Codes System
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(12) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_at TIMESTAMPTZ NULL,
  used_at TIMESTAMPTZ NULL,
  used_by UUID REFERENCES auth.users(id) NULL,
  purchased_at TIMESTAMPTZ NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'available',
  op_notes TEXT NULL,
  CONSTRAINT valid_status CHECK (status IN ('available', 'reserved', 'issued', 'used', 'revoked'))
);

CREATE TABLE IF NOT EXISTS public.verification_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES public.verification_codes(id),
  operator_id UUID NULL,
  action VARCHAR(64) NOT NULL,
  details JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_codes_status ON public.verification_codes(status);
CREATE INDEX idx_verification_codes_user_id ON public.verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON public.verification_codes(code);
CREATE INDEX idx_verification_audit_code_id ON public.verification_audit(code_id);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification codes"
ON public.verification_codes FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = used_by);

CREATE POLICY "Admins can view all verification codes"
ON public.verification_codes FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert verification codes"
ON public.verification_codes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update verification codes"
ON public.verification_codes FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can redeem verification codes"
ON public.verification_codes FOR UPDATE
USING (status IN ('issued', 'available') AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "Admins can view audit logs"
ON public.verification_audit FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
ON public.verification_audit FOR INSERT
WITH CHECK (true);

CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS VARCHAR(12) AS $$
DECLARE
  new_code VARCHAR(12);
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := LPAD(FLOOR(RANDOM() * 1000000000000)::VARCHAR, 12, '0');
    SELECT EXISTS(SELECT 1 FROM public.verification_codes WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_verification_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.verification_audit (code_id, operator_id, action, details)
    VALUES (NEW.id, auth.uid(), 'created', jsonb_build_object('code', NEW.code, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.verification_audit (code_id, operator_id, action, details)
      VALUES (NEW.id, auth.uid(), 
        CASE 
          WHEN NEW.status = 'used' THEN 'used'
          WHEN NEW.status = 'revoked' THEN 'revoked'
          WHEN NEW.status = 'issued' THEN 'issued'
          ELSE 'updated'
        END,
        jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status, 'user_id', NEW.user_id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER verification_audit_trigger
AFTER INSERT OR UPDATE ON public.verification_codes
FOR EACH ROW EXECUTE FUNCTION log_verification_audit();

-- Media table
CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  post_id UUID REFERENCES public.posts(id) NULL,
  url TEXT NOT NULL,
  mime TEXT NOT NULL,
  size BIGINT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_user_id ON public.media(user_id);
CREATE INDEX idx_media_post_id ON public.media(post_id);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media"
ON public.media FOR SELECT
USING (true);

CREATE POLICY "Users can upload their own media"
ON public.media FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own media"
ON public.media FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS media_ids UUID[] DEFAULT '{}';

-- Creator Pages
CREATE TABLE IF NOT EXISTS public.creator_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  cover_url TEXT,
  profile_url TEXT,
  cover_media_id UUID REFERENCES public.media(id) NULL,
  profile_media_id UUID REFERENCES public.media(id) NULL,
  is_published BOOLEAN DEFAULT false,
  monetization_enabled BOOLEAN DEFAULT false,
  custom_css TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_creator_pages_user_id ON public.creator_pages(user_id);
CREATE INDEX idx_creator_pages_slug ON public.creator_pages(slug);
CREATE INDEX idx_creator_pages_published ON public.creator_pages(is_published);

ALTER TABLE public.creator_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published creator pages"
ON public.creator_pages FOR SELECT
USING (is_published = true);

CREATE POLICY "Users can view their own creator pages"
ON public.creator_pages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own creator pages"
ON public.creator_pages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own creator pages"
ON public.creator_pages FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own creator pages"
ON public.creator_pages FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_creator_pages_updated_at
BEFORE UPDATE ON public.creator_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION validate_creator_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'Slug must contain only lowercase letters, numbers, and hyphens';
  END IF;
  IF LENGTH(NEW.slug) < 3 OR LENGTH(NEW.slug) > 50 THEN
    RAISE EXCEPTION 'Slug must be between 3 and 50 characters';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_creator_slug_trigger
BEFORE INSERT OR UPDATE ON public.creator_pages
FOR EACH ROW
EXECUTE FUNCTION validate_creator_slug();
