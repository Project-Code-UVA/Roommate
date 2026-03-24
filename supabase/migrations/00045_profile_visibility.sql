-- Migration: Profile visibility toggles
-- Adds show_hometown boolean for privacy control (PRIV-01).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_hometown boolean NOT NULL DEFAULT true;
