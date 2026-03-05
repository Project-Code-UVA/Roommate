-- === THREADS ===
CREATE POLICY "threads_select_participant" ON public.threads
  FOR SELECT TO authenticated
  USING (
    user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())
  );

-- === MESSAGES ===
CREATE POLICY "messages_select_participant" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.id = thread_id
      AND (t.user_a_id = (select auth.uid()) OR t.user_b_id = (select auth.uid()))
    )
  );

CREATE POLICY "messages_insert_participant" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.id = thread_id
      AND (t.user_a_id = (select auth.uid()) OR t.user_b_id = (select auth.uid()))
    )
  );
