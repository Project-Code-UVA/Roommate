-- Migration: Add onboarding fields for Phase 2
-- Adds: onboarding_completed on users, gender + show_gender on profiles, age validation trigger

-- 1. Add onboarding_completed flag to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 2. Add gender fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS show_gender boolean NOT NULL DEFAULT true;

-- 3. Age validation trigger: reject under-18 users at insert time
CREATE OR REPLACE FUNCTION public.validate_age()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birthdate > (CURRENT_DATE - INTERVAL '18 years')::date THEN
    RAISE EXCEPTION 'User must be 18 or older';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists to make migration idempotent
DROP TRIGGER IF EXISTS check_age_before_insert ON public.users;

CREATE TRIGGER check_age_before_insert
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.validate_age();
