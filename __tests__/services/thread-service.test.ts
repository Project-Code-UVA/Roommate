/**
 * Tests for thread-service.
 * Covers: MSG-01, MSG-03
 */

import { resetAllMocks, mockSupabase } from "../setup";
import { getThreads, getThread, markThreadDelivered } from "@/services/thread-service";

const TEST_USER_ID = "test-user-id";
const TEST_THREAD_ID = "thread-123";

describe("thread-service", () => {
  beforeEach(resetAllMocks);

  describe("getThreads", () => {
    it("returns threads for user", async () => {
      const threads = [
        {
          id: "thread-1",
          match_id: "match-1",
          user_a_id: TEST_USER_ID,
          user_b_id: "other-1",
          status: "active",
          created_at: "2026-03-11T00:00:00Z",
        },
      ];
      const chain = createChainMock({ data: threads, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getThreads(TEST_USER_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("threads");
      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it("returns empty array when no threads exist", async () => {
      const chain = createChainMock({ data: [], error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getThreads(TEST_USER_ID);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("returns error on fetch failure", async () => {
      const chain = createChainMock({ data: null, error: { message: "Fetch failed" } });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getThreads(TEST_USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Fetch failed");
    });
  });

  describe("getThread", () => {
    it("returns single thread by id with other_user data", async () => {
      const thread = {
        id: TEST_THREAD_ID,
        match_id: "match-1",
        user_a_id: TEST_USER_ID,
        user_b_id: "other-1",
        status: "active",
        created_at: "2026-03-11T00:00:00Z",
      };
      const chain = createChainMock({ data: thread, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getThread(TEST_THREAD_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("threads");
      expect(chain.eq).toHaveBeenCalledWith("id", TEST_THREAD_ID);
      expect(chain.single).toHaveBeenCalled();
      expect(result.data).toEqual(thread);
      expect(result.error).toBeNull();
    });

    it("returns error when thread not found", async () => {
      const chain = createChainMock({ data: null, error: { message: "Not found" } });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getThread("nonexistent");

      expect(result.data).toBeNull();
      expect(result.error).toBe("Not found");
    });
  });

  describe("markThreadDelivered", () => {
    it("updates delivered_at on all undelivered messages from other user", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await markThreadDelivered(TEST_THREAD_ID, TEST_USER_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("messages");
      expect(chain.update).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("thread_id", TEST_THREAD_ID);
      expect(chain.neq).toHaveBeenCalledWith("sender_id", TEST_USER_ID);
      expect(chain.is).toHaveBeenCalledWith("delivered_at", null);
      expect(result.error).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// Helper: chainable query mock
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
