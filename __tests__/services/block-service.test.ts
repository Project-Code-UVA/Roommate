/**
 * Tests for block-service.
 * Covers: MSG-08, SAFE-02
 */

import { resetAllMocks, mockSupabase } from "../setup";

const mockUnmatchUser = jest.fn();

jest.mock("@/services/match-service", () => ({
  unmatchUser: (...args: unknown[]) => mockUnmatchUser(...args),
}));

import { blockFromChat, blockUser } from "@/services/block-service";

const TEST_USER_ID = "test-user-id";
const OTHER_USER_ID = "other-user-id";

describe("block-service", () => {
  beforeEach(() => {
    resetAllMocks();
    mockUnmatchUser.mockReset();
  });

  describe("blockFromChat", () => {
    it("calls unmatchUser with blockToo=true (MSG-08)", async () => {
      mockUnmatchUser.mockResolvedValueOnce({ success: true, error: null });

      await blockFromChat(TEST_USER_ID, OTHER_USER_ID);

      expect(mockUnmatchUser).toHaveBeenCalledWith(TEST_USER_ID, OTHER_USER_ID, true);
    });

    it("returns success on successful block", async () => {
      mockUnmatchUser.mockResolvedValueOnce({ success: true, error: null });

      const result = await blockFromChat(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("returns error on failure", async () => {
      mockUnmatchUser.mockResolvedValueOnce({ success: false, error: "Block failed" });

      const result = await blockFromChat(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Block failed");
    });
  });

  describe("blockUser", () => {
    it("calls supabase.rpc with block_user and returns success", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

      const result = await blockUser(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("returns error when RPC returns error field", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: { error: "cannot_block_self" },
        error: null,
      });

      const result = await blockUser(TEST_USER_ID, TEST_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("cannot_block_self");
    });

    it("returns error when RPC call fails", async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Network error" },
      });

      const result = await blockUser(TEST_USER_ID, OTHER_USER_ID);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });
});
