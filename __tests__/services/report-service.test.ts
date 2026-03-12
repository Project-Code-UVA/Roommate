/**
 * Tests for report-service.
 * Covers: MSG-08
 */

import { resetAllMocks, mockSupabase } from "../setup";
import { submitReport } from "@/services/report-service";
import type { ReportCategory } from "@/types/chat";

const TEST_REPORTER_ID = "reporter-id";
const TEST_REPORTED_ID = "reported-id";

describe("report-service", () => {
  beforeEach(resetAllMocks);

  describe("submitReport", () => {
    it("inserts into reports table with category and description", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await submitReport(
        TEST_REPORTER_ID,
        TEST_REPORTED_ID,
        "harassment" as ReportCategory,
        "Sending threatening messages",
      );

      expect(mockSupabase.from).toHaveBeenCalledWith("reports");
      expect(chain.insert).toHaveBeenCalledWith({
        reporter_id: TEST_REPORTER_ID,
        reported_id: TEST_REPORTED_ID,
        reason: "harassment",
        details: "Sending threatening messages",
      });
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("submits report without description", async () => {
      const chain = createChainMock({ data: null, error: null });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await submitReport(
        TEST_REPORTER_ID,
        TEST_REPORTED_ID,
        "spam" as ReportCategory,
      );

      expect(chain.insert).toHaveBeenCalledWith({
        reporter_id: TEST_REPORTER_ID,
        reported_id: TEST_REPORTED_ID,
        reason: "spam",
        details: null,
      });
      expect(result.success).toBe(true);
    });

    it("returns error on insert failure", async () => {
      const chain = createChainMock({ data: null, error: { message: "Insert failed" } });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await submitReport(
        TEST_REPORTER_ID,
        TEST_REPORTED_ID,
        "harassment" as ReportCategory,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Insert failed");
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
