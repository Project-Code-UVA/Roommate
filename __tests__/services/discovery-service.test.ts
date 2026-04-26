/**
 * Tests for discovery-service.
 * Covers: DISC-05, DISC-08, DISC-09, DISC-10
 */

import { resetAllMocks, mockSupabase } from "../setup";
import {
  getDiscoveryStack,
  updateModeStatus,
  dismissProfile,
  saveProfile,
  unsaveProfile,
} from "@/services/discovery-service";

const TEST_USER_ID = "test-user-id";
const TARGET_USER_ID = "target-user-id";

describe("discovery-service", () => {
  beforeEach(resetAllMocks);

  describe("getDiscoveryStack", () => {
    it("calls rpc with get_discovery_stack without p_filters when unfiltered", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getDiscoveryStack(TEST_USER_ID);

      // No p_filters key so the call still matches the legacy 3-arg overload
      // on remote DBs where the filter migration hasn't been applied yet.
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_discovery_stack", {
        p_user_id: TEST_USER_ID,
        p_limit: 20,
        p_offset: 0,
      });
      const call = mockSupabase.rpc.mock.calls[0];
      expect(call[1]).not.toHaveProperty("p_filters");
    });

    it("forwards session filters as p_filters payload", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getDiscoveryStack(TEST_USER_ID, 20, 0, {
        cleanliness: ["very_tidy", "tidy"],
        pets: ["no_pets"],
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_discovery_stack", {
        p_user_id: TEST_USER_ID,
        p_limit: 20,
        p_offset: 0,
        p_filters: {
          cleanliness: ["very_tidy", "tidy"],
          pets: ["no_pets"],
        },
      });
    });

    it("omits p_filters when all category arrays are empty", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getDiscoveryStack(TEST_USER_ID, 20, 0, {
        cleanliness: [],
        pets: [],
      });

      const call = mockSupabase.rpc.mock.calls[0];
      expect(call[0]).toBe("get_discovery_stack");
      expect(call[1]).not.toHaveProperty("p_filters");
    });

    it("drops empty category arrays but keeps populated ones", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getDiscoveryStack(TEST_USER_ID, 20, 0, {
        cleanliness: ["very_tidy"],
        pets: [],
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "get_discovery_stack",
        expect.objectContaining({
          p_filters: { cleanliness: ["very_tidy"] },
        }),
      );
    });

    it("returns array of DiscoveryProfile objects on success", async () => {
      const profiles = [
        { user_id: "u1", display_name: "Alice", rank_score: 80 },
        { user_id: "u2", display_name: "Bob", rank_score: 75 },
      ];
      mockSupabase.rpc.mockResolvedValueOnce({ data: profiles, error: null });

      const result = await getDiscoveryStack(TEST_USER_ID);

      expect(result.data).toEqual(profiles);
      expect(result.error).toBeNull();
    });

    it("passes limit and offset parameters for pagination", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getDiscoveryStack(TEST_USER_ID, 10, 5);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_discovery_stack", {
        p_user_id: TEST_USER_ID,
        p_limit: 10,
        p_offset: 5,
      });
    });

    it("returns empty array when no profiles available (DISC-10)", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await getDiscoveryStack(TEST_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("returns error message on RPC failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await getDiscoveryStack(TEST_USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toBe("RPC error");
    });
  });

  describe("updateModeStatus", () => {
    it("calls rpc with update_mode_status and new status (DISC-08)", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await updateModeStatus(TEST_USER_ID, "roommate");

      expect(mockSupabase.rpc).toHaveBeenCalledWith("update_mode_status", {
        p_user_id: TEST_USER_ID,
        p_new_status: "roommate",
      });
    });

    it("accepts roommate, friends, and found_roommate statuses", async () => {
      const statuses = ["roommate", "friends", "found_roommate"] as const;

      for (const status of statuses) {
        resetAllMocks();
        mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

        const result = await updateModeStatus(TEST_USER_ID, status);

        expect(result.error).toBeNull();
        expect(mockSupabase.rpc).toHaveBeenCalledWith("update_mode_status", {
          p_user_id: TEST_USER_ID,
          p_new_status: status,
        });
      }
    });

    it("returns error on invalid status transition", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Invalid status transition" },
      });

      const result = await updateModeStatus(TEST_USER_ID, "roommate");

      expect(result.error).toBe("Invalid status transition");
    });

    it("returns error on RPC failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await updateModeStatus(TEST_USER_ID, "friends");

      expect(result.error).toBe("RPC error");
    });
  });

  describe("dismissProfile", () => {
    it("calls rpc with dismiss_profile and target user ID", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      await dismissProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("dismiss_profile", {
        p_user_id: TEST_USER_ID,
        p_dismissed_id: TARGET_USER_ID,
      });
    });

    it("returns success on valid dismissal", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await dismissProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(result.error).toBeNull();
    });

    it("returns error on RPC failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Dismiss failed" },
      });

      const result = await dismissProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(result.error).toBe("Dismiss failed");
    });
  });

  describe("saveProfile", () => {
    it("inserts into saves table via supabase.from", async () => {
      await saveProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("saves");
    });

    it("handles duplicate save gracefully (idempotent)", async () => {
      // Default mock returns { data: [], error: null } which is success
      const result = await saveProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      const chainMock = createErrorChain("Insert failed");
      mockSupabase.from.mockReturnValueOnce(chainMock);

      const result = await saveProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(result.error).toBe("Insert failed");
    });
  });

  describe("unsaveProfile", () => {
    it("deletes from saves table", async () => {
      await unsaveProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("saves");
    });

    it("returns error on failure", async () => {
      const chainMock = createErrorChain("Delete failed");
      mockSupabase.from.mockReturnValueOnce(chainMock);

      const result = await unsaveProfile(TEST_USER_ID, TARGET_USER_ID);

      expect(result.error).toBe("Delete failed");
    });
  });
});

/**
 * Creates a chainable query mock that resolves with an error.
 */
function createErrorChain(message: string) {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "single", "maybeSingle", "match",
    "order", "limit", "range", "filter", "not", "or",
    "is", "in", "contains", "overlaps",
  ];

  methods.forEach((method) => {
    chain[method] = jest.fn().mockReturnValue(chain);
  });

  Object.defineProperty(chain, "then", {
    value: jest.fn((resolve?: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: { message } }).then(resolve),
    ),
    writable: true,
    configurable: true,
  });

  return chain;
}
