/**
 * Tests for match-service.
 * Covers: MTCH-01, MTCH-04
 */

import { resetAllMocks, mockSupabase } from "../setup";
import { likeProfile, unmatchUser, getMatches } from "@/services/match-service";

const TEST_USER_ID = "test-user-id";
const OTHER_USER_ID = "other-user-id";

describe("match-service", () => {
  beforeEach(resetAllMocks);

  describe("likeProfile", () => {
    it("calls rpc with like_profile and both user IDs (MTCH-01)", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true, is_match: false, match_id: null, thread_id: null },
        error: null,
      });

      await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("like_profile", {
        p_liker_id: TEST_USER_ID,
        p_liked_id: OTHER_USER_ID,
      });
    });

    it("returns is_match true when mutual like creates a match", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          is_match: true,
          match_id: "match-1",
          thread_id: "thread-1",
        },
        error: null,
      });

      const result = await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(result.is_match).toBe(true);
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("returns match_id and thread_id on mutual match", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          is_match: true,
          match_id: "match-abc",
          thread_id: "thread-xyz",
        },
        error: null,
      });

      const result = await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(result.match_id).toBe("match-abc");
      expect(result.thread_id).toBe("thread-xyz");
    });

    it("returns is_match false when no reciprocal like exists", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: {
          success: true,
          is_match: false,
          match_id: null,
          thread_id: null,
        },
        error: null,
      });

      const result = await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(result.is_match).toBe(false);
      expect(result.match_id).toBeNull();
      expect(result.thread_id).toBeNull();
    });

    it("handles blocked user error gracefully", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: false, error: "blocked" },
        error: null,
      });

      const result = await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("blocked");
    });

    it("handles no_shared_school error gracefully", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: false, error: "no_shared_school" },
        error: null,
      });

      const result = await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("no_shared_school");
    });

    it("handles already_matched_or_unmatched error", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: false, error: "already_matched_or_unmatched" },
        error: null,
      });

      const result = await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("already_matched_or_unmatched");
    });

    it("returns error on RPC failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await likeProfile(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("RPC error");
    });
  });

  describe("unmatchUser", () => {
    it("calls rpc with unmatch_user and both user IDs (MTCH-04)", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await unmatchUser(TEST_USER_ID, OTHER_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("unmatch_user", {
        p_user_id: TEST_USER_ID,
        p_other_id: OTHER_USER_ID,
        p_block_too: false,
      });
    });

    it("passes block_too flag when user chooses to block", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      await unmatchUser(TEST_USER_ID, OTHER_USER_ID, true);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("unmatch_user", {
        p_user_id: TEST_USER_ID,
        p_other_id: OTHER_USER_ID,
        p_block_too: true,
      });
    });

    it("returns success on valid unmatch", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const result = await unmatchUser(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("returns error on RPC failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Unmatch failed" },
      });

      const result = await unmatchUser(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unmatch failed");
    });
  });

  describe("getMatches", () => {
    it("fetches active matches for user (unmatched_at IS NULL)", async () => {
      const matches = [
        { id: "m1", user_a_id: TEST_USER_ID, user_b_id: "u2", unmatched_at: null },
        { id: "m2", user_a_id: "u3", user_b_id: TEST_USER_ID, unmatched_at: null },
      ];
      const chain = createChainMock({ data: matches, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getMatches(TEST_USER_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("matches");
      expect(result.data).toEqual(matches);
      expect(result.error).toBeNull();
    });

    it("returns empty array when no matches exist", async () => {
      const chain = createChainMock({ data: [], error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getMatches(TEST_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("returns error on fetch failure", async () => {
      const chain = createChainMock({
        data: null,
        error: { message: "Fetch failed" },
      });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getMatches(TEST_USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Fetch failed");
    });
  });
});

// ---------------------------------------------------------------------------
// Helper: chainable query mock with specific resolved value
// ---------------------------------------------------------------------------

function createChainMock(resolvedValue: unknown) {
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
      Promise.resolve(resolvedValue).then(resolve),
    ),
    writable: true,
    configurable: true,
  });

  return chain;
}
