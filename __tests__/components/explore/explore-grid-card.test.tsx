/**
 * Tests for ExploreGridCard component.
 * Covers: EXPL-01 (explore grid card rendering).
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { ExploreGridCard } from "@/components/explore/explore-grid-card";
import type { ExploreProfile } from "@/types/explore";

const mockProfile: ExploreProfile = {
  user_id: "user-123",
  display_name: "Alice",
  year: "Junior",
  photo_url: "https://example.com/alice.jpg",
  selfie_verified: true,
};

describe("ExploreGridCard", () => {
  it("renders photo, name, and year", () => {
    const { getByText, getByTestId } = render(
      <ExploreGridCard profile={mockProfile} onPress={jest.fn()} size={120} />,
    );

    expect(getByTestId("explore-card-user-123")).toBeTruthy();
    expect(getByText("Alice")).toBeTruthy();
    expect(getByText("Junior")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ExploreGridCard profile={mockProfile} onPress={onPress} size={120} />,
    );

    fireEvent.press(getByTestId("explore-card-user-123"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("handles missing year gracefully", () => {
    const profileNoYear: ExploreProfile = {
      ...mockProfile,
      year: null,
    };

    const { getByText, queryByText } = render(
      <ExploreGridCard profile={profileNoYear} onPress={jest.fn()} size={120} />,
    );

    expect(getByText("Alice")).toBeTruthy();
    expect(queryByText("Junior")).toBeNull();
  });
});
