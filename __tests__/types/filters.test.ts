/**
 * Unit tests for DiscoveryFilters helpers in src/types/filters.ts.
 */

import {
  countActiveFilters,
  normalizeFilters,
  type DiscoveryFilters,
} from "@/types/filters";

describe("countActiveFilters", () => {
  it("returns 0 for an empty object", () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it("counts only categories with at least one value", () => {
    const filters: DiscoveryFilters = {
      cleanliness: ["very_tidy"],
      pets: [],
      smoking: ["never", "outside_only"],
    };
    expect(countActiveFilters(filters)).toBe(2);
  });
});

describe("normalizeFilters", () => {
  it("returns an empty object when input is empty", () => {
    expect(normalizeFilters({})).toEqual({});
  });

  it("drops keys with empty arrays", () => {
    const input: DiscoveryFilters = {
      cleanliness: ["very_tidy"],
      pets: [],
      smoking: ["never"],
    };
    expect(normalizeFilters(input)).toEqual({
      cleanliness: ["very_tidy"],
      smoking: ["never"],
    });
  });

  it("does not mutate the input", () => {
    const input: DiscoveryFilters = {
      cleanliness: ["very_tidy"],
      pets: [],
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    normalizeFilters(input);
    expect(input).toEqual(snapshot);
  });
});
