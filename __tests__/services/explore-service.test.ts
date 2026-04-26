/**
 * Tests for explore-service.
 * Covers: EXPL-02 (explore feed fetching), EXPL-04 (profile detail).
 */

import { resetAllMocks, mockSupabase } from "../setup";
import {
  getExploreFeed,
  getProfileDetail,
} from "@/services/explore-service";

const TEST_USER_ID = "test-user-id";
const TARGET_USER_ID = "target-user-id";

describe("explore-service", () => {
  beforeEach(resetAllMocks);

  describe("getExploreFeed", () => {
    it("calls get_explore_feed RPC without p_filters when unfiltered", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getExploreFeed(TEST_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_explore_feed", {
        p_user_id: TEST_USER_ID,
        p_limit: 24,
        p_offset: 0,
        p_seed: 0,
      });
      const call = mockSupabase.rpc.mock.calls[0];
      expect(call[1]).not.toHaveProperty("p_filters");
    });

    it("forwards session filters as p_filters payload", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getExploreFeed(TEST_USER_ID, 24, 0, 123, {
        sleep_schedule: ["early_bird"],
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_explore_feed", {
        p_user_id: TEST_USER_ID,
        p_limit: 24,
        p_offset: 0,
        p_seed: 123,
        p_filters: { sleep_schedule: ["early_bird"] },
      });
    });

    it("omits p_filters when all category arrays are empty", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getExploreFeed(TEST_USER_ID, 24, 0, 0, { pets: [] });

      const call = mockSupabase.rpc.mock.calls[0];
      expect(call[0]).toBe("get_explore_feed");
      expect(call[1]).not.toHaveProperty("p_filters");
    });

    it("returns empty array on error", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC failed" },
      });

      const result = await getExploreFeed(TEST_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.error).toBe("RPC failed");
    });

    it("passes seed parameter for shuffle", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getExploreFeed(TEST_USER_ID, 24, 0, 12345);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_explore_feed", {
        p_user_id: TEST_USER_ID,
        p_limit: 24,
        p_offset: 0,
        p_seed: 12345,
      });
    });

    it("paginates with offset", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getExploreFeed(TEST_USER_ID, 24, 48);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_explore_feed", {
        p_user_id: TEST_USER_ID,
        p_limit: 24,
        p_offset: 48,
        p_seed: 0,
      });
    });

    it("returns ExploreProfile[] shaped data", async () => {
      const profiles = [
        {
          user_id: "u1",
          display_name: "Alice",
          year: "Junior",
          photo_url: "https://example.com/a.jpg",
          selfie_verified: true,
        },
        {
          user_id: "u2",
          display_name: "Bob",
          year: null,
          photo_url: "https://example.com/b.jpg",
          selfie_verified: false,
        },
      ];
      mockSupabase.rpc.mockResolvedValueOnce({ data: profiles, error: null });

      const result = await getExploreFeed(TEST_USER_ID);

      expect(result.data).toEqual(profiles);
      expect(result.error).toBeNull();
    });
  });

  describe("getProfileDetail", () => {
    it("fetches full profile data for a single user", async () => {
      const fullProfile = {
        user_id: TARGET_USER_ID,
        display_name: "Alice",
        bio: "Hello",
        year: "Junior",
        hometown: "Austin",
        nitty_gritty: null,
        completion_score: 0.9,
        mode_status: "roommate",
        selfie_verified: true,
        last_active_at: "2026-03-17T00:00:00Z",
        rank_score: 0,
        photos: [{ id: "p1", url: "https://example.com/p1.jpg", position: 0 }],
      };
      mockSupabase.rpc.mockResolvedValueOnce({ data: fullProfile, error: null });

      const result = await getProfileDetail(TEST_USER_ID, TARGET_USER_ID);

      expect(result.data).toEqual(fullProfile);
      expect(result.error).toBeNull();
    });

    it("returns null data on error", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Not found" },
      });

      const result = await getProfileDetail(TEST_USER_ID, TARGET_USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Not found");
    });
  });
});
