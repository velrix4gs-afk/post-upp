-- Create AI settings table for admin-configurable AI options
CREATE TABLE public.ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read AI settings (for the settings page)
CREATE POLICY "Admins can read AI settings"
ON public.ai_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert AI settings
CREATE POLICY "Admins can insert AI settings"
ON public.ai_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update AI settings
CREATE POLICY "Admins can update AI settings"
ON public.ai_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can read for edge functions
CREATE POLICY "Service role can read AI settings"
ON public.ai_settings
FOR SELECT
USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_ai_settings_updated_at
BEFORE UPDATE ON public.ai_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.ai_settings (setting_key, setting_value) VALUES
('provider', '"lovable"'),
('model', '"google/gemini-2.5-flash"'),
('custom_api_key', '""'),
('system_prompt_user', '"You are Post Up AI - a friendly and helpful assistant for the Post Up social media platform. Help users navigate the app, answer questions about features, and provide tips for better engagement. Be conversational and friendly. Use emojis occasionally."'),
('system_prompt_admin', '"You are Post Up Admin AI - an intelligent assistant for administrators. Summarize user feedback, identify patterns in complaints or suggestions, provide actionable insights, and help draft responses to user issues. Be concise, professional, and data-driven."');