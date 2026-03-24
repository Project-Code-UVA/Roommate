/**
 * Integration test helpers for Phase 7 trust & safety tests.
 *
 * Uses Supabase service-role client to bypass RLS for test setup/teardown.
 * Helpers create real Supabase records -- these tests require a running
 * Supabase instance (local or remote) with SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY environment variables set.
 *
 * Plan 02 will flesh out the implementations; this file provides
 * the contract and stubs.
 */

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Service role client (bypasses RLS)
// ---------------------------------------------------------------------------

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ---------------------------------------------------------------------------
// Helper: Create a test user with auth + public.users record
// ---------------------------------------------------------------------------

export async function createTestUser(
  overrides?: {
    email?: string;
    enforcement_state?: string;
    selfie_verified?: boolean;
  },
): Promise<{ id: string; email: string }> {
  // Implementation stub -- Plan 02 will flesh out
  throw new Error("Not implemented");
}

// ---------------------------------------------------------------------------
// Helper: Add a user to a school
// ---------------------------------------------------------------------------

export async function addUserToSchool(
  userId: string,
  schoolId: string,
): Promise<void> {
  // Implementation stub -- Plan 02 will flesh out
  throw new Error("Not implemented");
}

// ---------------------------------------------------------------------------
// Helper: Clean up test users
// ---------------------------------------------------------------------------

export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  // Implementation stub -- Plan 02 will flesh out
  throw new Error("Not implemented");
}
