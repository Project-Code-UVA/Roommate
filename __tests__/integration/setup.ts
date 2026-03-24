/**
 * Integration test helpers for Phase 7 trust & safety tests.
 *
 * Uses Supabase service-role client to bypass RLS for test setup/teardown.
 * Helpers create real Supabase records -- these tests require a running
 * Supabase instance (local or remote) with SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY environment variables set.
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Service role client (bypasses RLS)
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Integration tests require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars",
  );
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Cached school IDs
// ---------------------------------------------------------------------------

let cachedSchoolIds: { schoolA: string; schoolB: string } | null = null;

/**
 * Fetches 2 distinct school IDs from the seeded schools table.
 * Caches result so it only fetches once per test run.
 */
export async function getSchoolIds(): Promise<{
  schoolA: string;
  schoolB: string;
}> {
  if (cachedSchoolIds) {
    return cachedSchoolIds;
  }

  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("id")
    .limit(2);

  if (error || !data || data.length < 2) {
    throw new Error(
      `Failed to fetch school IDs: ${error?.message ?? "Need at least 2 schools seeded"}`,
    );
  }

  cachedSchoolIds = { schoolA: data[0].id, schoolB: data[1].id };
  return cachedSchoolIds;
}

// ---------------------------------------------------------------------------
// Helper: Create a test user with auth + public.users + public.profiles
// ---------------------------------------------------------------------------

interface CreateTestUserOverrides {
  readonly email?: string;
  readonly enforcement_state?: string;
  readonly selfie_verified?: boolean;
  readonly onboarding_completed?: boolean;
  readonly display_name?: string;
}

export async function createTestUser(
  overrides?: CreateTestUserOverrides,
): Promise<{ id: string; email: string }> {
  const email =
    overrides?.email ??
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.room.app`;

  // 1. Create auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: "test-password-123!",
      email_confirm: true,
    });

  if (authError || !authData.user) {
    throw new Error(`Failed to create auth user: ${authError?.message}`);
  }

  const userId = authData.user.id;

  // 2. Insert into public.users
  const { error: userError } = await supabaseAdmin.from("users").insert({
    id: userId,
    birthdate: "2000-01-01",
    enforcement_state: overrides?.enforcement_state ?? "none",
    selfie_verified: overrides?.selfie_verified ?? false,
    onboarding_completed: overrides?.onboarding_completed ?? true,
  });

  if (userError) {
    // Clean up auth user on failure
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(`Failed to insert user record: ${userError.message}`);
  }

  // 3. Insert into public.profiles
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    user_id: userId,
    display_name: overrides?.display_name ?? "Test User",
    year: "2026",
    bio: "Test bio",
    completion_score: 80,
  });

  if (profileError) {
    // Clean up on failure (cascade will handle profiles from auth delete)
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(`Failed to insert profile record: ${profileError.message}`);
  }

  // 4. Insert a test photo (approved) so user appears in explore/discovery feeds
  const { error: photoError } = await supabaseAdmin.from("photos").insert({
    user_id: userId,
    url: `https://test.room.app/photos/${userId}/1.jpg`,
    order_index: 0,
    moderation_status: "approved",
  });

  if (photoError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw new Error(`Failed to insert photo record: ${photoError.message}`);
  }

  return { id: userId, email };
}

// ---------------------------------------------------------------------------
// Helper: Add a user to a school
// ---------------------------------------------------------------------------

export async function addUserToSchool(
  userId: string,
  schoolId?: string,
): Promise<void> {
  const targetSchoolId =
    schoolId ?? (await getSchoolIds()).schoolA;

  const { error } = await supabaseAdmin.from("user_schools").insert({
    user_id: userId,
    school_id: targetSchoolId,
  });

  if (error) {
    throw new Error(`Failed to add user to school: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Helper: Create a test thread between two users
// ---------------------------------------------------------------------------

export async function createTestThread(
  userAId: string,
  userBId: string,
): Promise<{ matchId: string; threadId: string }> {
  const orderedA = userAId < userBId ? userAId : userBId;
  const orderedB = userAId < userBId ? userBId : userAId;

  // Create match with canonical ordering
  const { data: matchData, error: matchError } = await supabaseAdmin
    .from("matches")
    .insert({ user_a_id: orderedA, user_b_id: orderedB })
    .select("id")
    .single();

  if (matchError || !matchData) {
    throw new Error(`Failed to create match: ${matchError?.message}`);
  }

  // Create thread linked to match
  const { data: threadData, error: threadError } = await supabaseAdmin
    .from("threads")
    .insert({
      match_id: matchData.id,
      user_a_id: orderedA,
      user_b_id: orderedB,
      status: "active",
    })
    .select("id")
    .single();

  if (threadError || !threadData) {
    throw new Error(`Failed to create thread: ${threadError?.message}`);
  }

  return { matchId: matchData.id, threadId: threadData.id };
}

// ---------------------------------------------------------------------------
// Helper: Set enforcement state on a user
// ---------------------------------------------------------------------------

export async function setEnforcementState(
  userId: string,
  state: string,
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("users")
    .update({ enforcement_state: state })
    .eq("id", userId);

  if (error) {
    throw new Error(
      `Failed to set enforcement state to "${state}": ${error.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Helper: Clean up test users
// ---------------------------------------------------------------------------

export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    // Deleting the auth user cascades to public.users, which cascades to
    // profiles, user_schools, likes, matches, threads, messages, etc.
    await supabaseAdmin.auth.admin.deleteUser(userId);
  }
}
