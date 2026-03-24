/**
 * Integration tests: Likes blocking (SAFE-02, SAFE-06)
 *
 * Validates that blocked users are excluded from likes lists,
 * that the block_user RPC properly removes likes, and that
 * the "underage" report reason is valid.
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

describe("Likes RPCs - Block Enforcement (SAFE-02)", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let schoolA: string;

  beforeAll(async () => {
    const schools = await getSchoolIds();
    schoolA = schools.schoolA;

    userA = await createTestUser({ display_name: "Likes UserA" });
    userB = await createTestUser({ display_name: "Likes UserB" });

    await addUserToSchool(userA.id, schoolA);
    await addUserToSchool(userB.id, schoolA);

    // userA likes userB (for get_my_likes test)
    await supabaseAdmin.rpc("like_profile", {
      p_liker_id: userA.id,
      p_liked_id: userB.id,
    });
  });

  afterAll(async () => {
    await cleanupTestUsers([userA.id, userB.id]);
  });

  test("excludes blocked users from my-likes list", async () => {
    // Verify userB is in my-likes before block
    const { data: beforeData } = await supabaseAdmin.rpc("get_my_likes", {
      p_user_id: userA.id,
      p_limit: 50,
      p_offset: 0,
    });

    const beforeResult =
      typeof beforeData === "string" ? JSON.parse(beforeData) : beforeData;
    const beforeIds = Array.isArray(beforeResult)
      ? beforeResult.map((p: { user_id: string }) => p.user_id)
      : [];
    expect(beforeIds).toContain(userB.id);

    // Block userB
    await supabaseAdmin.rpc("block_user", {
      p_blocker_id: userA.id,
      p_blocked_id: userB.id,
    });

    // Verify userB is excluded after block
    const { data: afterData, error } = await supabaseAdmin.rpc(
      "get_my_likes",
      {
        p_user_id: userA.id,
        p_limit: 50,
        p_offset: 0,
      },
    );

    expect(error).toBeNull();

    const afterResult =
      typeof afterData === "string" ? JSON.parse(afterData) : afterData;
    const afterIds = Array.isArray(afterResult)
      ? afterResult.map((p: { user_id: string }) => p.user_id)
      : [];

    expect(afterIds).not.toContain(userB.id);
  });
});

describe("Liked-Me - Block Enforcement (SAFE-02)", () => {
  let userC: { id: string; email: string };
  let userD: { id: string; email: string };
  let schoolA: string;

  beforeAll(async () => {
    const schools = await getSchoolIds();
    schoolA = schools.schoolA;

    // Fresh users for liked-me test (block removes likes, so need isolated setup)
    userC = await createTestUser({ display_name: "LikedMe UserC" });
    userD = await createTestUser({ display_name: "LikedMe UserD" });

    await addUserToSchool(userC.id, schoolA);
    await addUserToSchool(userD.id, schoolA);

    // userD likes userC (for get_liked_me test)
    await supabaseAdmin.rpc("like_profile", {
      p_liker_id: userD.id,
      p_liked_id: userC.id,
    });
  });

  afterAll(async () => {
    await cleanupTestUsers([userC.id, userD.id]);
  });

  test("excludes blocked users from liked-me list", async () => {
    // Verify userD is in liked-me before block
    const { data: beforeData } = await supabaseAdmin.rpc("get_liked_me", {
      p_user_id: userC.id,
      p_limit: 50,
      p_offset: 0,
      p_is_paid: true,
    });

    const beforeResult =
      typeof beforeData === "string" ? JSON.parse(beforeData) : beforeData;
    const beforeIds = Array.isArray(beforeResult)
      ? beforeResult.map((p: { user_id: string }) => p.user_id)
      : [];
    expect(beforeIds).toContain(userD.id);

    // Block userD
    await supabaseAdmin.rpc("block_user", {
      p_blocker_id: userC.id,
      p_blocked_id: userD.id,
    });

    // Verify userD excluded after block
    const { data: afterData, error } = await supabaseAdmin.rpc(
      "get_liked_me",
      {
        p_user_id: userC.id,
        p_limit: 50,
        p_offset: 0,
        p_is_paid: true,
      },
    );

    expect(error).toBeNull();

    const afterResult =
      typeof afterData === "string" ? JSON.parse(afterData) : afterData;
    const afterIds = Array.isArray(afterResult)
      ? afterResult.map((p: { user_id: string }) => p.user_id)
      : [];

    expect(afterIds).not.toContain(userD.id);
  });
});

describe("Underage Report Category (SAFE-06)", () => {
  let userE: { id: string; email: string };
  let userF: { id: string; email: string };

  beforeAll(async () => {
    userE = await createTestUser({ display_name: "Report UserE" });
    userF = await createTestUser({ display_name: "Report UserF" });
  });

  afterAll(async () => {
    await cleanupTestUsers([userE.id, userF.id]);
  });

  test("underage report category is accepted by the database", async () => {
    const { error } = await supabaseAdmin.from("reports").insert({
      reporter_id: userE.id,
      reported_id: userF.id,
      reason: "underage",
      details: "User appears to be under 18",
    });

    // The enum should accept "underage" as a valid report_reason
    expect(error).toBeNull();
  });
});
