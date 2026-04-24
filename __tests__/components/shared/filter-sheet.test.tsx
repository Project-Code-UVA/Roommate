/**
 * Tests for FilterSheet component.
 *
 * Covers the session-level filter UI used on Discovery + Explore:
 * multi-select toggle behavior, Clear all, per-category clearing, and the
 * Apply → onApply contract that feeds the hooks.
 */

jest.mock("nativewind", () => {
  const { View } = require("react-native");
  return { styled: (c: unknown) => c, StyledComponent: View };
});

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { FilterSheet } from "@/components/shared/filter-sheet";
import type { DiscoveryFilters } from "@/types/filters";

function makeProps(overrides: Partial<React.ComponentProps<typeof FilterSheet>> = {}) {
  return {
    visible: true,
    initialFilters: {} as DiscoveryFilters,
    onApply: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
}

describe("FilterSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the header title and Clear all action", () => {
    const props = makeProps();
    const { getByText } = render(<FilterSheet {...props} />);

    expect(getByText("Filters")).toBeTruthy();
    expect(getByText("Clear all")).toBeTruthy();
  });

  it("renders all 9 nitty-gritty category sections", () => {
    const props = makeProps();
    const { getByTestId } = render(<FilterSheet {...props} />);

    const categories = [
      "sleep_schedule",
      "cleanliness",
      "noise_level",
      "guests",
      "pets",
      "smoking",
      "partying",
      "study_habits",
      "budget_range",
    ];
    for (const key of categories) {
      expect(getByTestId(`filter-section-${key}`)).toBeTruthy();
    }
  });

  it("expands a section when tapped and reveals its chips", () => {
    const props = makeProps();
    const { getByTestId, queryByTestId } = render(<FilterSheet {...props} />);

    // Sections start collapsed
    expect(queryByTestId("filter-chip-cleanliness-very_tidy")).toBeNull();

    fireEvent.press(getByTestId("filter-section-cleanliness"));

    expect(getByTestId("filter-chip-cleanliness-very_tidy")).toBeTruthy();
    expect(getByTestId("filter-chip-cleanliness-tidy")).toBeTruthy();
  });

  it("buffers chip selections until Apply is tapped", () => {
    const onApply = jest.fn();
    const props = makeProps({ onApply });
    const { getByTestId } = render(<FilterSheet {...props} />);

    fireEvent.press(getByTestId("filter-section-cleanliness"));
    fireEvent.press(getByTestId("filter-chip-cleanliness-very_tidy"));
    fireEvent.press(getByTestId("filter-chip-cleanliness-tidy"));

    // onApply must NOT fire until the footer button is pressed
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("filter-apply"));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      cleanliness: ["very_tidy", "tidy"],
    });
  });

  it("toggles a chip off when tapped twice", () => {
    const onApply = jest.fn();
    const props = makeProps({ onApply });
    const { getByTestId } = render(<FilterSheet {...props} />);

    fireEvent.press(getByTestId("filter-section-pets"));
    fireEvent.press(getByTestId("filter-chip-pets-no_pets"));
    fireEvent.press(getByTestId("filter-chip-pets-no_pets"));
    fireEvent.press(getByTestId("filter-apply"));

    // Empty category is dropped from the payload
    expect(onApply).toHaveBeenCalledWith({});
  });

  it("Clear all empties the draft", () => {
    const onApply = jest.fn();
    const props = makeProps({
      onApply,
      initialFilters: { cleanliness: ["very_tidy"], pets: ["no_pets"] },
    });
    const { getByTestId } = render(<FilterSheet {...props} />);

    fireEvent.press(getByTestId("filter-clear-all"));
    fireEvent.press(getByTestId("filter-apply"));

    expect(onApply).toHaveBeenCalledWith({});
  });

  it("per-category clear removes only that category", () => {
    const onApply = jest.fn();
    const props = makeProps({
      onApply,
      initialFilters: { cleanliness: ["very_tidy"], pets: ["no_pets"] },
    });
    const { getByTestId } = render(<FilterSheet {...props} />);

    fireEvent.press(getByTestId("filter-clear-cleanliness"));
    fireEvent.press(getByTestId("filter-apply"));

    expect(onApply).toHaveBeenCalledWith({ pets: ["no_pets"] });
  });

  it("calls onClose after Apply", () => {
    const onClose = jest.fn();
    const props = makeProps({ onClose });
    const { getByTestId } = render(<FilterSheet {...props} />);

    fireEvent.press(getByTestId("filter-apply"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
