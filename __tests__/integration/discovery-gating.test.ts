/**
 * Integration tests: Discovery gating (SAFE-01)
 *
 * Validates that the discovery stack correctly filters by shared school
 * and excludes blocked users at the database level.
 *
 * Uses real Supabase RPCs -- requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import {
  supabaseAdmin,
  createTestUser,
  addUserToSchool,
  cleanupTestUsers,
  getSchoolIds,
} from "./setup";

jest.setTimeout(30000);

describe("Discovery Stack - Shared School Gating (SAFE-01)", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let userC: { id: string; email: string };
  let schoolA: string;
  let schoolB: string;

  beforeAll(async () => {
    const schools = await getSchoolIds();
    schoolA = schools.schoolA;
    schoolB = schools.schoolB;

    // userA at schoolA, userB at schoolA (shared), userC at schoolB only (not shared)
    userA = await createTestUser({ display_name: "Discovery UserA" });
    userB = await createTestUser({ display_name: "Discovery UserB" });
    userC = await createTestUser({ display_name: "Discovery UserC" });

    await addUserToSchool(userA.id, schoolA);
    await addUserToSchool(userB.id, schoolA);
    await addUserToSchool(userC.id, schoolB);
  });

  afterAll(async () => {
    await cleanupTestUsers([userA.id, userB.id, userC.id]);
  });

  test("returns profiles from shared schools", async () => {
    const { data, error } = await supabaseAdmin.rpc("get_discovery_stack", {
      p_user_id: userA.id,
      p_limit: 50,
      p_offset: 0,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    const userIds = Array.isArray(result)
      ? result.map((p: { user_id: string }) => p.user_id)
      : [];

    // userB shares schoolA with userA -- should appear
    expect(userIds).toContain(userB.id);
  });

  test("excludes profiles from non-shared schools", async () => {
    const { data, error } = await supabaseAdmin.rpc("get_discovery_stack", {
      p_user_id: userA.id,
      p_limit: 50,
      p_offset: 0,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    const userIds = Array.isArray(result)
      ? result.map((p: { user_id: string }) => p.user_id)
      : [];

    // userC is only at schoolB -- should NOT appear for userA
    expect(userIds).not.toContain(userC.id);
  });

  test("excludes blocked users from discovery stack", async () => {
    // Block userB from userA's perspective
    const { data: blockResult, error: blockError } = await supabaseAdmin.rpc(
      "block_user",
      {
        p_blocker_id: userA.id,
        p_blocked_id: userB.id,
      },
    );

    expect(blockError).toBeNull();
    const parsedBlock =
      typeof blockResult === "string" ? JSON.parse(blockResult) : blockResult;
    expect(parsedBlock.success).toBe(true);

    // Now query discovery stack -- userB should be excluded
    const { data, error } = await supabaseAdmin.rpc("get_discovery_stack", {
      p_user_id: userA.id,
      p_limit: 50,
      p_offset: 0,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    const userIds = Array.isArray(result)
      ? result.map((p: { user_id: string }) => p.user_id)
      : [];

    expect(userIds).not.toContain(userB.id);
  });
});
