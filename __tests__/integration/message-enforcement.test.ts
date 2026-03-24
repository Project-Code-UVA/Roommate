/**
 * Integration tests: Message enforcement (SAFE-04, SAFE-05)
 *
 * Validates that enforcement state correctly gates messaging and liking
 * at the database RPC level. Warning state should NOT block actions;
 * dm_ban blocks messaging but not liking; suspended/banned block both.
 */

// import { supabaseAdmin, createTestUser, addUserToSchool, cleanupTestUsers } from "./setup";

describe("Message Enforcement (SAFE-04, SAFE-05)", () => {
  describe("send_message enforcement", () => {
    it.todo("user with warning state CAN send messages");
    it.todo("user with dm_ban_48h state CANNOT send messages");
    it.todo("user with suspended_7d state CANNOT send messages");
    it.todo("user with permanent_ban state CANNOT send messages");
  });

  describe("like_profile enforcement", () => {
    it.todo("user with dm_ban_48h state CAN still like profiles");
    it.todo("user with suspended_7d state CANNOT like profiles");
  });
});
