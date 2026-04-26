/**
 * Tests for MyLikesCard component.
 * Covers: LIKE-02 (my likes card rendering).
 */

import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { MyLikesCard } from "@/components/likes/my-likes-card";
import type { MyLike } from "@/types/explore";

const mockLike: MyLike = {
  user_id: "liked-1",
  display_name: "Bob",
  year: "Sophomore",
  photo_url: "https://example.com/bob.jpg",
  liked_at: "2026-03-16T00:00:00Z",
};

describe("MyLikesCard", () => {
  it("renders photo and name with year", () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <MyLikesCard like={mockLike} onPress={onPress} size={100} />,
    );

    expect(getByTestId("my-like-card-liked-1")).toBeTruthy();
    expect(getByText("Bob, Sophomore")).toBeTruthy();
  });

  it("renders name only when year is null", () => {
    const noYearLike: MyLike = { ...mockLike, year: null };
    const onPress = jest.fn();
    const { getByText } = render(
      <MyLikesCard like={noYearLike} onPress={onPress} size={100} />,
    );

    expect(getByText("Bob")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MyLikesCard like={mockLike} onPress={onPress} size={100} />,
    );

    fireEvent.press(getByTestId("my-like-card-liked-1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
