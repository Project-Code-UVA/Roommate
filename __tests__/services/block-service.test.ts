/**
 * Tests for block-service.
 * Covers: MSG-08
 */

import { resetAllMocks } from "../setup";

const mockUnmatchUser = jest.fn();

jest.mock("@/services/match-service", () => ({
  unmatchUser: (...args: unknown[]) => mockUnmatchUser(...args),
}));

import { blockFromChat } from "@/services/block-service";

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
});
