-- Migration: Dismiss profile RPC function
-- Tracks dismissal view counts for the 48-hour refresh cycle
-- Max 2 re-entries per dismissed profile (3 total views)

CREATE OR REPLACE FUNCTION public.dismiss_profile(
  p_user_id uuid,
  p_dismissed_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_view_count smallint;
BEGIN
  -- Validate not dismissing self
  IF p_user_id = p_dismissed_id THEN
    RETURN jsonb_build_object('error', 'cannot_dismiss_self');
  END IF;

  -- UPSERT: insert new dismissal or increment view count
  INSERT INTO dismissals (dismisser_id, dismissed_id, view_count, last_dismissed_at)
  VALUES (p_user_id, p_dismissed_id, 1, now())
  ON CONFLICT (dismisser_id, dismissed_id)
  DO UPDATE SET
    view_count = dismissals.view_count + 1,
    last_dismissed_at = now()
  RETURNING view_count INTO v_view_count;

  RETURN jsonb_build_object(
    'success', true,
    'view_count', v_view_count
  );
END;
$$;
