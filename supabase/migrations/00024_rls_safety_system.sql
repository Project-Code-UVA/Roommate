-- === BLOCKS ===
CREATE POLICY "blocks_select_own" ON public.blocks
  FOR SELECT TO authenticated
  USING (blocker_id = (select auth.uid()));

CREATE POLICY "blocks_insert_own" ON public.blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = (select auth.uid()));

CREATE POLICY "blocks_delete_own" ON public.blocks
  FOR DELETE TO authenticated
  USING (blocker_id = (select auth.uid()));

-- === REPORTS ===
CREATE POLICY "reports_select_own" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = (select auth.uid()));

CREATE POLICY "reports_insert_own" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (select auth.uid()));

-- === ENFORCEMENT_ACTIONS ===
CREATE POLICY "enforcement_actions_select_own" ON public.enforcement_actions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- === RANKING_CONFIG ===
CREATE POLICY "ranking_config_select_all" ON public.ranking_config
  FOR SELECT TO authenticated
  USING (true);

-- === ADS_ENGAGEMENT ===
CREATE POLICY "ads_engagement_select_own" ON public.ads_engagement
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

-- === SUBSCRIPTIONS ===
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
