-- Mark all incoming messages in a thread as read (and delivered).
-- Caller must be a participant in the thread; only updates messages NOT sent
-- by the caller. Used when a user opens a chat thread.

CREATE OR REPLACE FUNCTION public.mark_thread_read(p_thread_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_is_participant boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.threads
    WHERE id = p_thread_id
      AND (user_a_id = v_user_id OR user_b_id = v_user_id)
  ) INTO v_is_participant;

  IF NOT v_is_participant THEN
    RAISE EXCEPTION 'Not a participant in this thread';
  END IF;

  UPDATE public.messages
  SET read_at = COALESCE(read_at, now()),
      delivered_at = COALESCE(delivered_at, now())
  WHERE thread_id = p_thread_id
    AND sender_id <> v_user_id
    AND read_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_thread_read(uuid) TO authenticated;
