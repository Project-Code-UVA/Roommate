/**
 * Tests for likes-service.
 * Covers: LIKE-01, LIKE-02, LIKE-03, LIKE-04 (my likes, liked me, count).
 */

import { resetAllMocks, mockSupabase } from "../setup";
import {
  getMyLikes,
  getLikedMe,
  getLikedMeCount,
} from "@/services/likes-service";

const TEST_USER_ID = "test-user-id";

describe("likes-service", () => {
  beforeEach(resetAllMocks);

  describe("getMyLikes", () => {
    it("calls get_my_likes RPC with correct params", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getMyLikes(TEST_USER_ID);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_my_likes", {
        p_user_id: TEST_USER_ID,
        p_limit: 24,
        p_offset: 0,
      });
    });

    it("returns pending likes on success", async () => {
      const likes = [
        { user_id: "u1", display_name: "Alice", year: "Junior", photo_url: "https://example.com/a.jpg", liked_at: "2026-03-17T00:00:00Z" },
        { user_id: "u2", display_name: "Bob", year: null, photo_url: "https://example.com/b.jpg", liked_at: "2026-03-16T00:00:00Z" },
      ];
      mockSupabase.rpc.mockResolvedValueOnce({ data: likes, error: null });

      const result = await getMyLikes(TEST_USER_ID);

      expect(result.data).toEqual(likes);
      expect(result.error).toBeNull();
    });

    it("returns empty array and error on failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC failed" },
      });

      const result = await getMyLikes(TEST_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.error).toBe("RPC failed");
    });

    it("handles empty results gracefully", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      const result = await getMyLikes(TEST_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("passes custom limit and offset", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: [], error: null });

      await getMyLikes(TEST_USER_ID, 10, 5);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_my_likes", {
        p_user_id: TEST_USER_ID,
        p_limit: 10,
        p_offset: 5,
      });
    });
  });

  describe("getLikedMe", () => {
    it("returns blurred data for free users (isPaid=false)", async () => {
      const profiles = [
        { user_id: "u1", photo_url: "https://example.com/a.jpg", display_name: null, liked_at: "2026-03-17T00:00:00Z" },
      ];
      mockSupabase.rpc.mockResolvedValueOnce({ data: profiles, error: null });

      const result = await getLikedMe(TEST_USER_ID, 24, 0, false);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_liked_me", {
        p_user_id: TEST_USER_ID,
        p_limit: 24,
        p_offset: 0,
        p_is_paid: false,
      });
      expect(result.data[0].display_name).toBeNull();
      expect(result.error).toBeNull();
    });

    it("returns full data for paid users (isPaid=true)", async () => {
      const profiles = [
        { user_id: "u1", photo_url: "https://example.com/a.jpg", display_name: "Alice", liked_at: "2026-03-17T00:00:00Z" },
      ];
      mockSupabase.rpc.mockResolvedValueOnce({ data: profiles, error: null });

      const result = await getLikedMe(TEST_USER_ID, 24, 0, true);

      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_liked_me", {
        p_user_id: TEST_USER_ID,
        p_limit: 24,
        p_offset: 0,
        p_is_paid: true,
      });
      expect(result.data[0].display_name).toBe("Alice");
    });

    it("returns empty array and error on failure", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC error" },
      });

      const result = await getLikedMe(TEST_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.error).toBe("RPC error");
    });
  });

  describe("getLikedMeCount", () => {
    it("returns integer count on success", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 7, error: null });

      const result = await getLikedMeCount(TEST_USER_ID);

      expect(result.count).toBe(7);
      expect(result.error).toBeNull();
    });

    it("returns count=0 on error", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Count failed" },
      });

      const result = await getLikedMeCount(TEST_USER_ID);

      expect(result.count).toBe(0);
      expect(result.error).toBe("Count failed");
    });

    it("handles non-numeric data gracefully", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const result = await getLikedMeCount(TEST_USER_ID);

      expect(result.count).toBe(0);
      expect(result.error).toBeNull();
    });
  });
});
