-- Migration: Selfie storage bucket and RLS policies
-- Public bucket for verified badge display; user-scoped upload/update
-- Requirements: AUTH-07

-- Create selfie storage bucket (public read for verified badge display)
INSERT INTO storage.buckets (id, name, public)
VALUES ('selfies', 'selfies', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own selfie (folder = their user id)
CREATE POLICY "Users can upload own selfie"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update/overwrite their own selfie
CREATE POLICY "Users can update own selfie"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'selfies'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public read access for selfies (verified badge images)
CREATE POLICY "Public read selfies"
ON storage.objects FOR SELECT
USING (bucket_id = 'selfies');

-- RPC: Mark a user as selfie-verified (called after server-side verification)
CREATE OR REPLACE FUNCTION public.set_selfie_verified(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET selfie_verified = true
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
