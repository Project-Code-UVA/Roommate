/**
 * Tests for filter-service.
 * Covers: DISC-06, DISC-07
 */

import { resetAllMocks, mockSupabase } from "../setup";
import {
  getNittyGritty,
  updateSelfValues,
  updatePreferences,
  updateDealbreakers,
} from "@/services/filter-service";
import type { NittyGritty } from "@/types/filters";

const TEST_USER_ID = "test-user-id";

const EXISTING_NITTY_GRITTY: NittyGritty = {
  self: { sleep_schedule: "night_owl", cleanliness: "tidy" },
  preferences: { guests: ["rarely", "sometimes"] },
  dealbreakers: { smoking: ["daily"] },
};

describe("filter-service", () => {
  beforeEach(resetAllMocks);

  describe("getNittyGritty", () => {
    it("fetches nitty_gritty from profile for given user ID", async () => {
      const chain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getNittyGritty(TEST_USER_ID);

      expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
      expect(result.data).toEqual(EXISTING_NITTY_GRITTY);
      expect(result.error).toBeNull();
    });

    it("returns default empty structure when no data exists", async () => {
      const chain = createSelectChain({
        data: { nitty_gritty: null },
        error: null,
      });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getNittyGritty(TEST_USER_ID);

      expect(result.data).toEqual({
        self: {},
        preferences: {},
        dealbreakers: {},
      });
      expect(result.error).toBeNull();
    });

    it("returns error on fetch failure", async () => {
      const chain = createSelectChain({
        data: null,
        error: { message: "Fetch failed" },
      });
      mockSupabase.from.mockReturnValueOnce(chain);

      const result = await getNittyGritty(TEST_USER_ID);

      expect(result.data).toBeNull();
      expect(result.error).toBe("Fetch failed");
    });
  });

  describe("updateSelfValues", () => {
    it("updates self layer of nitty_gritty JSONB (DISC-06)", async () => {
      // First call: read current nitty_gritty
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      // Second call: write updated nitty_gritty
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      const result = await updateSelfValues(
        TEST_USER_ID,
        "pets",
        "have_pets",
      );

      expect(result.error).toBeNull();
      // Verify the write call used immutable update
      expect(writeChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          nitty_gritty: {
            self: {
              sleep_schedule: "night_owl",
              cleanliness: "tidy",
              pets: "have_pets",
            },
            preferences: { guests: ["rarely", "sometimes"] },
            dealbreakers: { smoking: ["daily"] },
          },
        }),
      );
    });

    it("preserves existing preferences and dealbreakers when updating self", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      await updateSelfValues(TEST_USER_ID, "cleanliness", "very_tidy");

      const writtenValue = writeChain.update.mock.calls[0][0].nitty_gritty;
      expect(writtenValue.preferences).toEqual(
        EXISTING_NITTY_GRITTY.preferences,
      );
      expect(writtenValue.dealbreakers).toEqual(
        EXISTING_NITTY_GRITTY.dealbreakers,
      );
    });

    it("validates category is a valid FilterCategory", async () => {
      const result = await updateSelfValues(
        TEST_USER_ID,
        "invalid_category" as any,
        "some_value",
      );

      expect(result.error).toBe("Invalid filter category: invalid_category");
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("returns error on update failure", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({
        data: null,
        error: { message: "Update failed" },
      });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      const result = await updateSelfValues(
        TEST_USER_ID,
        "pets",
        "have_pets",
      );

      expect(result.error).toBe("Update failed");
    });
  });

  describe("updatePreferences", () => {
    it("updates preferences layer of nitty_gritty JSONB (DISC-06)", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      const result = await updatePreferences(TEST_USER_ID, "noise_level", [
        "quiet",
        "moderate",
      ]);

      expect(result.error).toBeNull();
    });

    it("accepts array of acceptable values for a category", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      await updatePreferences(TEST_USER_ID, "cleanliness", [
        "very_tidy",
        "tidy",
        "moderate",
      ]);

      const writtenValue = writeChain.update.mock.calls[0][0].nitty_gritty;
      expect(writtenValue.preferences.cleanliness).toEqual([
        "very_tidy",
        "tidy",
        "moderate",
      ]);
    });

    it("preserves existing self and dealbreakers when updating preferences", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      await updatePreferences(TEST_USER_ID, "noise_level", ["quiet"]);

      const writtenValue = writeChain.update.mock.calls[0][0].nitty_gritty;
      expect(writtenValue.self).toEqual(EXISTING_NITTY_GRITTY.self);
      expect(writtenValue.dealbreakers).toEqual(
        EXISTING_NITTY_GRITTY.dealbreakers,
      );
    });

    it("returns error on update failure", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({
        data: null,
        error: { message: "Update failed" },
      });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      const result = await updatePreferences(TEST_USER_ID, "noise_level", [
        "quiet",
      ]);

      expect(result.error).toBe("Update failed");
    });
  });

  describe("updateDealbreakers", () => {
    it("updates dealbreakers layer of nitty_gritty JSONB (DISC-07)", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      const result = await updateDealbreakers(TEST_USER_ID, "partying", [
        "often",
      ]);

      expect(result.error).toBeNull();
    });

    it("accepts array of values to hard-exclude", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      await updateDealbreakers(TEST_USER_ID, "smoking", ["social", "daily"]);

      const writtenValue = writeChain.update.mock.calls[0][0].nitty_gritty;
      expect(writtenValue.dealbreakers.smoking).toEqual(["social", "daily"]);
    });

    it("preserves existing self and preferences when updating dealbreakers", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({ data: null, error: null });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      await updateDealbreakers(TEST_USER_ID, "partying", ["often"]);

      const writtenValue = writeChain.update.mock.calls[0][0].nitty_gritty;
      expect(writtenValue.self).toEqual(EXISTING_NITTY_GRITTY.self);
      expect(writtenValue.preferences).toEqual(
        EXISTING_NITTY_GRITTY.preferences,
      );
    });

    it("returns error on update failure", async () => {
      const readChain = createSelectChain({
        data: { nitty_gritty: EXISTING_NITTY_GRITTY },
        error: null,
      });
      const writeChain = createUpdateChain({
        data: null,
        error: { message: "Update failed" },
      });

      mockSupabase.from.mockReturnValueOnce(readChain);
      mockSupabase.from.mockReturnValueOnce(writeChain);

      const result = await updateDealbreakers(TEST_USER_ID, "partying", [
        "often",
      ]);

      expect(result.error).toBe("Update failed");
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers: chainable query mocks with specific resolved values
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

function createSelectChain(resolvedValue: { data: unknown; error: unknown }) {
  return createChainMock(resolvedValue);
}

function createUpdateChain(resolvedValue: { data: unknown; error: unknown }) {
  return createChainMock(resolvedValue);
}
