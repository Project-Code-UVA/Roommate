/**
 * Integration tests: Message enforcement (SAFE-04, SAFE-05)
 *
 * Validates that enforcement state correctly gates messaging and liking
 * at the database RPC level. Warning state should NOT block actions;
 * dm_ban blocks messaging but not liking; suspended/banned block both.
 *
 * Uses real Supabase RPCs -- requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import {
  supabaseAdmin,
  createTestUser,
  addUserToSchool,
  cleanupTestUsers,
  createTestThread,
  setEnforcementState,
  getSchoolIds,
} from "./setup";

jest.setTimeout(30000);

describe("Message Sending - Enforcement State Checks (SAFE-04, SAFE-05)", () => {
  let userA: { id: string; email: string };
  let userB: { id: string; email: string };
  let threadId: string;
  let schoolA: string;

  beforeAll(async () => {
    const schools = await getSchoolIds();
    schoolA = schools.schoolA;

    userA = await createTestUser({ display_name: "Msg UserA" });
    userB = await createTestUser({ display_name: "Msg UserB" });

    await addUserToSchool(userA.id, schoolA);
    await addUserToSchool(userB.id, schoolA);

    const thread = await createTestThread(userA.id, userB.id);
    threadId = thread.threadId;
  });

  afterAll(async () => {
    await cleanupTestUsers([userA.id, userB.id]);
  });

  afterEach(async () => {
    // Reset enforcement state between tests
    await setEnforcementState(userA.id, "none");
  });

  test("user with warning state CAN send messages", async () => {
    await setEnforcementState(userA.id, "warning");

    const { data, error } = await supabaseAdmin.rpc("send_message", {
      p_thread_id: threadId,
      p_sender_id: userA.id,
      p_body: "Hello from warning user",
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    expect(result.success).toBe(true);
    expect(result.message_id).toBeDefined();
  });

  test("user with dm_ban_48h state CANNOT send messages", async () => {
    await setEnforcementState(userA.id, "dm_ban_48h");

    const { data, error } = await supabaseAdmin.rpc("send_message", {
      p_thread_id: threadId,
      p_sender_id: userA.id,
      p_body: "Hello from banned user",
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    expect(result.error).toBe("under_enforcement");
  });

  test("user with suspended_7d state CANNOT send messages", async () => {
    await setEnforcementState(userA.id, "suspended_7d");

    const { data, error } = await supabaseAdmin.rpc("send_message", {
      p_thread_id: threadId,
      p_sender_id: userA.id,
      p_body: "Hello from suspended user",
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    expect(result.error).toBe("under_enforcement");
  });

  test("user with permanent_ban state CANNOT send messages", async () => {
    await setEnforcementState(userA.id, "permanent_ban");

    const { data, error } = await supabaseAdmin.rpc("send_message", {
      p_thread_id: threadId,
      p_sender_id: userA.id,
      p_body: "Hello from banned user",
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    expect(result.error).toBe("under_enforcement");
  });
});

describe("Like Profile - Enforcement State Checks (SAFE-04)", () => {
  let userA: { id: string; email: string };
  let likeTargets: Array<{ id: string; email: string }>;
  let schoolA: string;
  let targetIndex: number;

  beforeAll(async () => {
    const schools = await getSchoolIds();
    schoolA = schools.schoolA;

    userA = await createTestUser({ display_name: "Like UserA" });
    await addUserToSchool(userA.id, schoolA);

    // Create multiple like targets (each like_profile call needs a fresh target
    // since like is idempotent and match detection complicates re-use)
    likeTargets = [];
    for (let i = 0; i < 3; i++) {
      const target = await createTestUser({
        display_name: `Like Target ${i}`,
      });
      await addUserToSchool(target.id, schoolA);
      likeTargets.push(target);
    }

    targetIndex = 0;
  });

  afterAll(async () => {
    const allIds = [userA.id, ...likeTargets.map((t) => t.id)];
    await cleanupTestUsers(allIds);
  });

  afterEach(async () => {
    await setEnforcementState(userA.id, "none");
  });

  test("user with warning state CAN like profiles", async () => {
    await setEnforcementState(userA.id, "warning");
    const target = likeTargets[targetIndex++];

    const { data, error } = await supabaseAdmin.rpc("like_profile", {
      p_liker_id: userA.id,
      p_liked_id: target.id,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    expect(result.success).toBe(true);
  });

  test("user with dm_ban_48h state CAN like profiles", async () => {
    await setEnforcementState(userA.id, "dm_ban_48h");
    const target = likeTargets[targetIndex++];

    const { data, error } = await supabaseAdmin.rpc("like_profile", {
      p_liker_id: userA.id,
      p_liked_id: target.id,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    expect(result.success).toBe(true);
  });

  test("user with suspended_7d state CANNOT like profiles", async () => {
    await setEnforcementState(userA.id, "suspended_7d");
    const target = likeTargets[targetIndex++];

    const { data, error } = await supabaseAdmin.rpc("like_profile", {
      p_liker_id: userA.id,
      p_liked_id: target.id,
    });

    expect(error).toBeNull();

    const result = typeof data === "string" ? JSON.parse(data) : data;
    expect(result.error).toBe("under_enforcement");
  });
});
