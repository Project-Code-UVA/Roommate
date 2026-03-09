/**
 * Test stubs for discovery-service.
 * Covers: DISC-05, DISC-08, DISC-09, DISC-10
 */

import { resetAllMocks } from "../setup";

// TODO: uncomment when service is created
// import { getDiscoveryStack, updateModeStatus, dismissProfile, saveProfile } from "@/services/discovery-service";

describe("discovery-service", () => {
  beforeEach(resetAllMocks);

  describe("getDiscoveryStack", () => {
    it.todo("calls rpc with get_discovery_stack and user ID");
    it.todo("returns array of DiscoveryProfile objects on success");
    it.todo("passes limit and offset parameters for pagination");
    it.todo("returns empty array when no profiles available (DISC-10)");
    it.todo("returns error message on RPC failure");
  });

  describe("updateModeStatus", () => {
    it.todo("calls rpc with update_mode_status and new status (DISC-08)");
    it.todo("accepts roommate, friends, and found_roommate statuses");
    it.todo("returns error on invalid status transition");
    it.todo("returns error on RPC failure");
  });

  describe("dismissProfile", () => {
    it.todo("calls rpc with dismiss_profile and target user ID");
    it.todo("returns success on valid dismissal");
    it.todo("returns error on RPC failure");
  });

  describe("saveProfile", () => {
    it.todo("inserts into saves table via supabase.from");
    it.todo("handles duplicate save gracefully (idempotent)");
    it.todo("returns error on failure");
  });
});
