-- Migration: Update mode status RPC function
-- Allows users to toggle between roommate/friends/found_roommate modes
-- Requirements: DISC-08

CREATE OR REPLACE FUNCTION public.update_mode_status(
  p_user_id uuid,
  p_new_status mode_status
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status mode_status;
BEGIN
  -- Get current status and validate user exists
  SELECT mode_status INTO v_current_status
  FROM users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'user_not_found');
  END IF;

  -- Update mode status
  UPDATE users
  SET mode_status = p_new_status
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'mode_status', p_new_status::text
  );
END;
$$;
