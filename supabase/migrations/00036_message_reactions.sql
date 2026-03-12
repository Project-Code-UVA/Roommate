-- Migration: Create message_reactions table with RLS (MSG-04)
CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX idx_reactions_message_id ON public.message_reactions(message_id);

-- Enable Row Level Security
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- SELECT: Thread participants can read reactions on messages in their threads
CREATE POLICY "reactions_select_thread_participant" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.threads t ON t.id = m.thread_id
      WHERE m.id = message_reactions.message_id
      AND (t.user_a_id = (SELECT auth.uid()) OR t.user_b_id = (SELECT auth.uid()))
    )
  );

-- INSERT: Users can add their own reactions on messages in their threads
CREATE POLICY "reactions_insert_own" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.threads t ON t.id = m.thread_id
      WHERE m.id = message_reactions.message_id
      AND (t.user_a_id = (SELECT auth.uid()) OR t.user_b_id = (SELECT auth.uid()))
    )
  );

-- DELETE: Users can remove their own reactions
CREATE POLICY "reactions_delete_own" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));
