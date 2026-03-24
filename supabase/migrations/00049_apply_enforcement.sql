-- Migration: apply_enforcement_action RPC
-- Admin-facing function to apply enforcement actions with proper escalation
-- Sets enforcement state on user and records action with duration
-- Requirements: SAFE-04, SAFE-05

CREATE OR REPLACE FUNCTION public.apply_enforcement_action(
  p_admin_id uuid,
  p_user_id uuid,
  p_action enforcement_action_type
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_id uuid;
  v_end_at timestamptz;
BEGIN
  -- Calculate end_at based on action type
  CASE p_action
    WHEN 'warning' THEN
      v_end_at := NULL;  -- One-time modal, no duration
    WHEN 'dm_ban_48h' THEN
      v_end_at := now() + interval '48 hours';
    WHEN 'suspended_7d' THEN
      v_end_at := now() + interval '7 days';
    WHEN 'permanent_ban' THEN
      v_end_at := NULL;  -- No expiration
  END CASE;

  -- Insert enforcement action record
  INSERT INTO enforcement_actions (user_id, action, start_at, end_at)
  VALUES (p_user_id, p_action, now(), v_end_at)
  RETURNING id INTO v_action_id;

  -- Update user enforcement state
  UPDATE users
  SET enforcement_state = p_action::text::enforcement_state
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'enforcement_action_id', v_action_id);
END;
$$;
