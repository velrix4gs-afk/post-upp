-- Fix PUBLIC_DATA_EXPOSURE vulnerabilities in profiles and events tables

-- ============================================================
-- FIX 1: Profiles Table - Remove overly permissive policies
-- ============================================================
-- These policies have `qual: true` which makes ALL user data public
-- including phone numbers, birth dates, location, etc.

DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles view" ON public.profiles;

-- The "Users can view public profiles or their own" policy remains
-- which properly checks is_private and friendship status

-- ============================================================
-- FIX 2: Events Table - Remove debug and overly permissive policies
-- ============================================================
-- These policies expose ALL events to everyone regardless of privacy

DROP POLICY IF EXISTS "Allow select on events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can view all events (debug)" ON public.events;
DROP POLICY IF EXISTS "Allow insert on events" ON public.events;

-- The remaining policies properly check:
-- - Event ownership (created_by = auth.uid())
-- - Event attendance (EXISTS in event_attendees)
-- - Friendship status for friend's events