-- === USERS ===
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "users_select_shared_school" ON public.users
  FOR SELECT TO authenticated
  USING (
    id != (select auth.uid())
    AND (select public.shares_school((select auth.uid()), id))
    AND NOT (select public.is_blocked((select auth.uid()), id))
  );

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- === PROFILES ===
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "profiles_select_shared_school" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    user_id != (select auth.uid())
    AND (select public.shares_school((select auth.uid()), user_id))
    AND NOT (select public.is_blocked((select auth.uid()), user_id))
  );

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- === PHOTOS ===
CREATE POLICY "photos_select_own" ON public.photos
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "photos_select_shared_school" ON public.photos
  FOR SELECT TO authenticated
  USING (
    user_id != (select auth.uid())
    AND (select public.shares_school((select auth.uid()), user_id))
    AND NOT (select public.is_blocked((select auth.uid()), user_id))
  );

CREATE POLICY "photos_insert_own" ON public.photos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "photos_update_own" ON public.photos
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "photos_delete_own" ON public.photos
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- === SCHOOLS ===
CREATE POLICY "schools_select_all" ON public.schools
  FOR SELECT TO authenticated
  USING (true);

-- === USER_SCHOOLS ===
CREATE POLICY "user_schools_select_own" ON public.user_schools
  FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "user_schools_select_others" ON public.user_schools
  FOR SELECT TO authenticated
  USING (user_id != (select auth.uid()));

CREATE POLICY "user_schools_insert_own" ON public.user_schools
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "user_schools_delete_own" ON public.user_schools
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));
