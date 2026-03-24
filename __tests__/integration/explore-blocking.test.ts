/**
 * Integration tests: Explore blocking (SAFE-02)
 *
 * Validates that the explore feed excludes blocked users and
 * users under active enforcement at the database level.
 */

// import { supabaseAdmin, createTestUser, addUserToSchool, cleanupTestUsers } from "./setup";

describe("Explore Blocking (SAFE-02)", () => {
  it.todo("excludes blocked users from explore feed");
  it.todo("excludes users with active enforcement from explore feed");
  it.todo("block_user RPC hides user from subsequent explore queries");
});
