/**
 * Tests for LikedMeCard component.
 * Covers: LIKE-03 (liked-me card with blur/reveal).
 */

import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { LikedMeCard } from "@/components/likes/liked-me-card";
import type { LikedMeProfile } from "@/types/explore";

const mockProfile: LikedMeProfile = {
  user_id: "liker-1",
  photo_url: "https://example.com/liker.jpg",
  display_name: null,
  liked_at: "2026-03-15T00:00:00Z",
};

const paidProfile: LikedMeProfile = {
  ...mockProfile,
  display_name: "Alice",
};

describe("LikedMeCard", () => {
  it("renders blurred photo for free users", () => {
    const onUpgrade = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <LikedMeCard
        profile={mockProfile}
        isPaid={false}
        onUpgrade={onUpgrade}
        onSelect={onSelect}
        size={100}
      />,
    );

    expect(getByTestId("liked-me-card-liker-1")).toBeTruthy();
    expect(getByTestId("blur-overlay")).toBeTruthy();
  });

  it("renders full card for paid users with name", () => {
    const onUpgrade = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId, getByText, queryByTestId } = render(
      <LikedMeCard
        profile={paidProfile}
        isPaid={true}
        onUpgrade={onUpgrade}
        onSelect={onSelect}
        size={100}
      />,
    );

    expect(getByTestId("liked-me-card-liker-1")).toBeTruthy();
    expect(queryByTestId("blur-overlay")).toBeNull();
    expect(getByText("Alice")).toBeTruthy();
  });

  it("calls onUpgrade when free user taps", () => {
    const onUpgrade = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <LikedMeCard
        profile={mockProfile}
        isPaid={false}
        onUpgrade={onUpgrade}
        onSelect={onSelect}
        size={100}
      />,
    );

    fireEvent.press(getByTestId("liked-me-card-liker-1"));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onSelect when paid user taps", () => {
    const onUpgrade = jest.fn();
    const onSelect = jest.fn();
    const { getByTestId } = render(
      <LikedMeCard
        profile={paidProfile}
        isPaid={true}
        onUpgrade={onUpgrade}
        onSelect={onSelect}
        size={100}
      />,
    );

    fireEvent.press(getByTestId("liked-me-card-liker-1"));
    expect(onSelect).toHaveBeenCalledWith(paidProfile);
    expect(onUpgrade).not.toHaveBeenCalled();
  });
});
