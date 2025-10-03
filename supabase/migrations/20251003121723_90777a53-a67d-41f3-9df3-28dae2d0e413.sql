-- Fix recursive RLS in chat_participants by using a security definer function
CREATE OR REPLACE FUNCTION public.is_chat_participant(_chat_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE chat_id = _chat_id
      AND user_id = _user_id
  )
$$;

-- Drop and recreate chat_participants policies without recursion
DROP POLICY IF EXISTS "Users can view participants of chats they're in" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;

CREATE POLICY "Users can view participants of chats they're in"
ON public.chat_participants
FOR SELECT
USING (public.is_chat_participant(chat_id, auth.uid()));

CREATE POLICY "Users can join chats"
ON public.chat_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Fix profiles RLS to respect privacy settings
DROP POLICY IF EXISTS "Anyone authenticated can view all profiles" ON public.profiles;

CREATE POLICY "Users can view public profiles or their own"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid() 
  OR is_private = false 
  OR EXISTS (
    SELECT 1 FROM friendships 
    WHERE ((requester_id = auth.uid() AND addressee_id = profiles.id) 
       OR (addressee_id = auth.uid() AND requester_id = profiles.id))
      AND status = 'accepted'
  )
);

-- Add RLS to email_otps table
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own OTPs"
ON public.email_otps
FOR SELECT
USING (email IN (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "System can insert OTPs"
ON public.email_otps
FOR INSERT
WITH CHECK (true);

-- Create user_roles system for RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Add default 'user' role to all existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Update handle_new_user to assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text from 1 for 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$function$;