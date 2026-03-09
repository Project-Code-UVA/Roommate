/**
 * Test stubs for filter-service.
 * Covers: DISC-06, DISC-07
 */

import { resetAllMocks } from "../setup";

// TODO: uncomment when service is created
// import { getNittyGritty, updateSelfValues, updatePreferences, updateDealbreakers } from "@/services/filter-service";

describe("filter-service", () => {
  beforeEach(resetAllMocks);

  describe("getNittyGritty", () => {
    it.todo("fetches nitty_gritty from profile for given user ID");
    it.todo("returns default empty structure when no data exists");
    it.todo("returns error on fetch failure");
  });

  describe("updateSelfValues", () => {
    it.todo("updates self layer of nitty_gritty JSONB (DISC-06)");
    it.todo("preserves existing preferences and dealbreakers when updating self");
    it.todo("validates category is a valid FilterCategory");
    it.todo("returns error on update failure");
  });

  describe("updatePreferences", () => {
    it.todo("updates preferences layer of nitty_gritty JSONB (DISC-06)");
    it.todo("accepts array of acceptable values for a category");
    it.todo("preserves existing self and dealbreakers when updating preferences");
    it.todo("returns error on update failure");
  });

  describe("updateDealbreakers", () => {
    it.todo("updates dealbreakers layer of nitty_gritty JSONB (DISC-07)");
    it.todo("accepts array of values to hard-exclude");
    it.todo("preserves existing self and preferences when updating dealbreakers");
    it.todo("returns error on update failure");
  });
});
