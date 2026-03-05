-- === LIKES ===
CREATE POLICY "likes_select_sent" ON public.likes
  FOR SELECT TO authenticated
  USING (liker_id = (select auth.uid()));

CREATE POLICY "likes_select_received" ON public.likes
  FOR SELECT TO authenticated
  USING (liked_id = (select auth.uid()));

CREATE POLICY "likes_insert_own" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (liker_id = (select auth.uid()));

CREATE POLICY "likes_delete_own" ON public.likes
  FOR DELETE TO authenticated
  USING (liker_id = (select auth.uid()));

-- === MATCHES ===
CREATE POLICY "matches_select_participant" ON public.matches
  FOR SELECT TO authenticated
  USING (
    user_a_id = (select auth.uid()) OR user_b_id = (select auth.uid())
  );

-- === DISMISSALS ===
CREATE POLICY "dismissals_select_own" ON public.dismissals
  FOR SELECT TO authenticated
  USING (dismisser_id = (select auth.uid()));

CREATE POLICY "dismissals_insert_own" ON public.dismissals
  FOR INSERT TO authenticated
  WITH CHECK (dismisser_id = (select auth.uid()));

-- === SAVES ===
CREATE POLICY "saves_select_own" ON public.saves
  FOR SELECT TO authenticated
  USING (saver_id = (select auth.uid()));

CREATE POLICY "saves_insert_own" ON public.saves
  FOR INSERT TO authenticated
  WITH CHECK (saver_id = (select auth.uid()));

CREATE POLICY "saves_delete_own" ON public.saves
  FOR DELETE TO authenticated
  USING (saver_id = (select auth.uid()));
