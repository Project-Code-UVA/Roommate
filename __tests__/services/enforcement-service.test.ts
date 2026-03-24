/**
 * Tests for enforcement-service.
 * Covers: SAFE-04, SAFE-05
 */

import { resetAllMocks, mockSupabase } from "../setup";
import {
  getEnforcementInfo,
  isActionBlocked,
  getActiveEnforcement,
} from "@/services/enforcement-service";

const TEST_USER_ID = "test-user-id";

describe("enforcement-service", () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe("getEnforcementInfo", () => {
    it("returns none state for clean user", async () => {
      // User has enforcement_state = "none"
      mockSupabase.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          then: jest.fn(),
        };
        Object.defineProperty(chain, "then", {
          value: jest.fn((resolve?: (v: unknown) => unknown) =>
            Promise.resolve({
              data: { enforcement_state: "none" },
              error: null,
            }).then(resolve),
          ),
          writable: true,
          configurable: true,
        });
        return chain;
      });

      const result = await getEnforcementInfo(TEST_USER_ID);

      expect(result.state).toBe("none");
      expect(result.endAt).toBeNull();
      expect(result.action).toBeNull();
    });

    it("returns active enforcement with end date for banned user", async () => {
      const mockAction = {
        id: "action-1",
        user_id: TEST_USER_ID,
        action: "dm_ban_48h",
        start_at: "2026-03-24T00:00:00Z",
        end_at: "2026-03-26T00:00:00Z",
        created_at: "2026-03-24T00:00:00Z",
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          then: jest.fn(),
        };

        // First call: users table -> enforcement_state
        // Second call: enforcement_actions table -> action details
        const data =
          callCount === 1
            ? { enforcement_state: "dm_ban_48h" }
            : mockAction;

        Object.defineProperty(chain, "then", {
          value: jest.fn((resolve?: (v: unknown) => unknown) =>
            Promise.resolve({ data, error: null }).then(resolve),
          ),
          writable: true,
          configurable: true,
        });
        return chain;
      });

      const result = await getEnforcementInfo(TEST_USER_ID);

      expect(result.state).toBe("dm_ban_48h");
      expect(result.endAt).toBe("2026-03-26T00:00:00Z");
      expect(result.action).toEqual(mockAction);
    });

    it("returns state with null action when no enforcement_actions record found", async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          then: jest.fn(),
        };

        const data = callCount === 1 ? { enforcement_state: "warning" } : null;

        Object.defineProperty(chain, "then", {
          value: jest.fn((resolve?: (v: unknown) => unknown) =>
            Promise.resolve({ data, error: null }).then(resolve),
          ),
          writable: true,
          configurable: true,
        });
        return chain;
      });

      const result = await getEnforcementInfo(TEST_USER_ID);

      expect(result.state).toBe("warning");
      expect(result.endAt).toBeNull();
      expect(result.action).toBeNull();
    });

    it("returns none state on query error", async () => {
      mockSupabase.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          then: jest.fn(),
        };
        Object.defineProperty(chain, "then", {
          value: jest.fn((resolve?: (v: unknown) => unknown) =>
            Promise.resolve({
              data: null,
              error: { message: "DB error" },
            }).then(resolve),
          ),
          writable: true,
          configurable: true,
        });
        return chain;
      });

      const result = await getEnforcementInfo(TEST_USER_ID);

      expect(result.state).toBe("none");
      expect(result.endAt).toBeNull();
      expect(result.action).toBeNull();
    });
  });

  describe("isActionBlocked", () => {
    it("returns false for none state on any action", () => {
      expect(isActionBlocked("like", "none")).toBe(false);
      expect(isActionBlocked("message", "none")).toBe(false);
      expect(isActionBlocked("swipe", "none")).toBe(false);
      expect(isActionBlocked("explore", "none")).toBe(false);
    });

    it("returns false for warning state on any action", () => {
      expect(isActionBlocked("like", "warning")).toBe(false);
      expect(isActionBlocked("message", "warning")).toBe(false);
      expect(isActionBlocked("swipe", "warning")).toBe(false);
      expect(isActionBlocked("explore", "warning")).toBe(false);
    });

    it("blocks only message for dm_ban_48h state", () => {
      expect(isActionBlocked("message", "dm_ban_48h")).toBe(true);
      expect(isActionBlocked("like", "dm_ban_48h")).toBe(false);
      expect(isActionBlocked("swipe", "dm_ban_48h")).toBe(false);
      expect(isActionBlocked("explore", "dm_ban_48h")).toBe(false);
    });

    it("blocks all actions for suspended_7d state", () => {
      expect(isActionBlocked("like", "suspended_7d")).toBe(true);
      expect(isActionBlocked("message", "suspended_7d")).toBe(true);
      expect(isActionBlocked("swipe", "suspended_7d")).toBe(true);
      expect(isActionBlocked("explore", "suspended_7d")).toBe(true);
    });

    it("blocks all actions for permanent_ban state", () => {
      expect(isActionBlocked("like", "permanent_ban")).toBe(true);
      expect(isActionBlocked("message", "permanent_ban")).toBe(true);
      expect(isActionBlocked("swipe", "permanent_ban")).toBe(true);
      expect(isActionBlocked("explore", "permanent_ban")).toBe(true);
    });
  });

  describe("getActiveEnforcement", () => {
    it("returns the most recent enforcement action", async () => {
      const mockAction = {
        id: "action-1",
        user_id: TEST_USER_ID,
        action: "dm_ban_48h",
        start_at: "2026-03-24T00:00:00Z",
        end_at: "2026-03-26T00:00:00Z",
        created_at: "2026-03-24T00:00:00Z",
      };

      mockSupabase.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          then: jest.fn(),
        };
        Object.defineProperty(chain, "then", {
          value: jest.fn((resolve?: (v: unknown) => unknown) =>
            Promise.resolve({ data: mockAction, error: null }).then(resolve),
          ),
          writable: true,
          configurable: true,
        });
        return chain;
      });

      const result = await getActiveEnforcement(TEST_USER_ID);

      expect(result).toEqual(mockAction);
    });

    it("returns null when no enforcement actions exist", async () => {
      mockSupabase.from.mockImplementation(() => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockReturnThis(),
          then: jest.fn(),
        };
        Object.defineProperty(chain, "then", {
          value: jest.fn((resolve?: (v: unknown) => unknown) =>
            Promise.resolve({ data: null, error: null }).then(resolve),
          ),
          writable: true,
          configurable: true,
        });
        return chain;
      });

      const result = await getActiveEnforcement(TEST_USER_ID);

      expect(result).toBeNull();
    });
  });
});
