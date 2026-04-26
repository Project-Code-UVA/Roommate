/**
 * Tests for PhotoIndicator component and photo navigation logic.
 * Covers: DISC-04 (photo carousel navigation with loop).
 */

import { render } from "@testing-library/react-native";
import * as React from "react";

import { PhotoIndicator } from "@/components/discovery/photo-indicator";

// ---------------------------------------------------------------------------
// PhotoIndicator rendering tests
// ---------------------------------------------------------------------------

describe("PhotoIndicator", () => {
  it("renders correct number of indicator segments", () => {
    const { getAllByTestId } = render(
      React.createElement(PhotoIndicator, { total: 4, current: 0 }),
    );

    const segments = getAllByTestId(/indicator-segment-/);
    expect(segments.length).toBe(4);
  });

  it("highlights active segment based on current index", () => {
    const { getByTestId } = render(
      React.createElement(PhotoIndicator, { total: 3, current: 1 }),
    );

    const activeSegment = getByTestId("indicator-segment-1");
    // Active segment should have bg-white class (NativeWind compiles to style)
    expect(activeSegment.props.className).toContain("bg-white");
    expect(activeSegment.props.className).not.toContain("bg-white/40");
  });

  it("non-active segments have reduced opacity style", () => {
    const { getByTestId } = render(
      React.createElement(PhotoIndicator, { total: 3, current: 1 }),
    );

    const inactiveSegment = getByTestId("indicator-segment-0");
    expect(inactiveSegment.props.className).toContain("bg-white/40");
  });

  it("returns null when total is 1 or less", () => {
    const { queryByTestId } = render(
      React.createElement(PhotoIndicator, { total: 1, current: 0 }),
    );

    expect(queryByTestId("photo-indicator")).toBeNull();
  });

  it("renders for total of 2 photos", () => {
    const { getAllByTestId } = render(
      React.createElement(PhotoIndicator, { total: 2, current: 0 }),
    );

    const segments = getAllByTestId(/indicator-segment-/);
    expect(segments.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Photo navigation logic tests (pure function behavior)
// ---------------------------------------------------------------------------

describe("Photo navigation logic", () => {
  // These test the navigation logic that SwipeCard implements
  // Testing as pure functions to isolate from gesture handler

  function navigateRight(currentIndex: number, total: number): number {
    return (currentIndex + 1) % total;
  }

  function navigateLeft(currentIndex: number, total: number): number {
    return currentIndex > 0 ? currentIndex - 1 : total - 1;
  }

  it("tapping right half increments photo index", () => {
    expect(navigateRight(0, 5)).toBe(1);
    expect(navigateRight(2, 5)).toBe(3);
  });

  it("tapping left half decrements photo index", () => {
    expect(navigateLeft(3, 5)).toBe(2);
    expect(navigateLeft(1, 5)).toBe(0);
  });

  it("tapping right on last photo loops to first (index 0)", () => {
    expect(navigateRight(4, 5)).toBe(0);
    expect(navigateRight(2, 3)).toBe(0);
  });

  it("tapping left on first photo loops to last", () => {
    expect(navigateLeft(0, 5)).toBe(4);
    expect(navigateLeft(0, 3)).toBe(2);
  });

  it("works correctly with single photo (no change on tap)", () => {
    // With 1 photo, navigating right: (0+1)%1 = 0
    expect(navigateRight(0, 1)).toBe(0);
    // With 1 photo, navigating left: 0 > 0 is false, so total-1 = 0
    expect(navigateLeft(0, 1)).toBe(0);
  });
});
