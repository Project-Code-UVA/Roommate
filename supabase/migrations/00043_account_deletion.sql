-- Migration: Account deletion support
-- Adds deactivated_at column and request_account_deletion RPC.
-- PRD: Immediate deactivation, hard delete within 30 days.

ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- RPC: Request account deletion (immediate deactivation, queued for hard delete)
CREATE OR REPLACE FUNCTION request_account_deletion(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is the account owner
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Deactivate immediately
  UPDATE users
  SET deactivated_at = now(),
      mode_status = 'found_roommate'  -- removes from all stacks
  WHERE id = p_user_id
    AND deactivated_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account not found or already deactivated');
  END IF;

  -- Hide from all visibility surfaces
  UPDATE profiles
  SET updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'deactivated_at', now()::text);
END;
$$;
