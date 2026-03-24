-- Migration: Profile detail RPC function
-- Returns a single full DiscoveryProfile for the Explore profile view modal.
-- Enforces block filtering and basic visibility checks.

CREATE OR REPLACE FUNCTION public.get_profile_detail(
  p_user_id uuid,
  p_target_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Verify not blocked in either direction
  IF is_blocked(p_user_id, p_target_id) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'user_id', p.user_id,
    'display_name', p.display_name,
    'bio', p.bio,
    'year', p.year,
    'hometown', p.hometown,
    'nitty_gritty', p.nitty_gritty,
    'completion_score', p.completion_score,
    'mode_status', u.mode_status,
    'selfie_verified', u.selfie_verified,
    'last_active_at', u.last_active_at,
    'rank_score', 0,
    'photos', COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object('id', ph.id, 'url', ph.url, 'position', ph.order_index)
        ORDER BY ph.order_index
      )
      FROM photos ph
      WHERE ph.user_id = p.user_id
        AND ph.moderation_status = 'approved'),
      '[]'::jsonb
    )
  )
  INTO v_result
  FROM profiles p
  JOIN users u ON u.id = p.user_id
  WHERE p.user_id = p_target_id
    AND u.onboarding_completed = true
    AND u.enforcement_state = 'none';

  RETURN v_result;
END;
$$;
