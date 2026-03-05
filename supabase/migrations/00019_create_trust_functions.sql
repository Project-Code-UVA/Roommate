-- is_blocked: bidirectional block check
-- SECURITY DEFINER: bypasses RLS on blocks table
-- STABLE: can be cached within a transaction
CREATE OR REPLACE FUNCTION public.is_blocked(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
END;
$$;

-- shares_school: checks if two users share at least one school
CREATE OR REPLACE FUNCTION public.shares_school(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_schools us1
    INNER JOIN public.user_schools us2 ON us1.school_id = us2.school_id
    WHERE us1.user_id = user_a AND us2.user_id = user_b
  );
END;
$$;
