/**
 * Integration tests: Explore blocking (SAFE-02)
 *
 * Validates that the explore feed excludes blocked users and
 * users under active enforcement at the database level.
 *
 * Uses real Supabase RPCs -- requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import {
  supabaseAdmin,
  createTestUser,
  addUserToSchool,
  cleanupTestUsers,
  setEnforcementState,
  getSchoolIds,
} from "./setup";

jest.setTimeout(30000);

describe("Explore Feed - Block Enforcement (SAFE-02)", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let userC: { id: string; email: string };
  let schoolA: string;

  beforeAll(async () => {
    const schools = await getSchoolIds();
    schoolA = schools.schoolA;

    userA = await createTestUser({ display_name: "Explore UserA" });
    userB = await createTestUser({ display_name: "Explore UserB" });
    userC = await createTestUser({ display_name: "Explore UserC" });

    await addUserToSchool(userA.id, schoolA);
    await addUserToSchool(userB.id, schoolA);
    await addUserToSchool(userC.id, schoolA);
  });

  afterAll(async () => {
    await cleanupTestUsers([userA.id, userB.id, userC.id]);
  });

  test("excludes blocked users from explore feed", async () => {
    // Block userB
    const { error: blockError } = await supabaseAdmin.rpc("block_user", {
      p_blocker_id: userA.id,
      p_blocked_id: userB.id,
    });
    expect(blockError).toBeNull();

    // Query explore feed
    const { data, error } = await supabaseAdmin.rpc("get_explore_feed", {
      p_user_id: userA.id,
      p_limit: 50,
      p_offset: 0,
      p_seed: 42,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    const userIds = Array.isArray(result)
      ? result.map((p: { user_id: string }) => p.user_id)
      : [];

    expect(userIds).not.toContain(userB.id);
  });

  test("excludes users with active enforcement from explore feed", async () => {
    // Set userC to suspended
    await setEnforcementState(userC.id, "suspended_7d");

    const { data, error } = await supabaseAdmin.rpc("get_explore_feed", {
      p_user_id: userA.id,
      p_limit: 50,
      p_offset: 0,
      p_seed: 42,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    const userIds = Array.isArray(result)
      ? result.map((p: { user_id: string }) => p.user_id)
      : [];

    expect(userIds).not.toContain(userC.id);

    // Reset enforcement state for cleanup
    await setEnforcementState(userC.id, "none");
  });

  test("block_user RPC returns success and is idempotent", async () => {
    // First block (may already exist from earlier test)
    const { data: first, error: firstError } = await supabaseAdmin.rpc(
      "block_user",
      {
        p_blocker_id: userA.id,
        p_blocked_id: userB.id,
      },
    );

    expect(firstError).toBeNull();
    const parsedFirst =
      typeof first === "string" ? JSON.parse(first) : first;
    expect(parsedFirst.success).toBe(true);

    // Second block -- should still succeed (idempotent)
    const { data: second, error: secondError } = await supabaseAdmin.rpc(
      "block_user",
      {
        p_blocker_id: userA.id,
        p_blocked_id: userB.id,
      },
    );

    expect(secondError).toBeNull();
    const parsedSecond =
      typeof second === "string" ? JSON.parse(second) : second;
    expect(parsedSecond.success).toBe(true);
  });
});
