-- Enforce one reaction per user per message.
-- Existing duplicates keep the most recent reaction by created_at.

WITH ranked_reactions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY message_id, user_id
      ORDER BY created_at DESC, id DESC
    ) AS rank
  FROM public.message_reactions
)
DELETE FROM public.message_reactions r
USING ranked_reactions rr
WHERE r.id = rr.id
  AND rr.rank > 1;

ALTER TABLE public.message_reactions
  DROP CONSTRAINT IF EXISTS message_reactions_message_id_user_id_emoji_key;

ALTER TABLE public.message_reactions
  ADD CONSTRAINT message_reactions_message_id_user_id_key
  UNIQUE (message_id, user_id);

DROP POLICY IF EXISTS "reactions_update_own" ON public.message_reactions;

CREATE POLICY "reactions_update_own" ON public.message_reactions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
