/**
 * Tests for MatchesRow component.
 * Covers: LIKE-01 (matches display in likes tab).
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { MatchesRow } from "@/components/likes/matches-row";
import type { EnrichedThread } from "@/services/thread-service";

const mockThread: EnrichedThread = {
  id: "thread-1",
  user_a_id: "me",
  user_b_id: "other-1",
  match_id: "match-1",
  status: "active",
  created_at: "2026-03-17T00:00:00Z",
  other_user_id: "other-1",
  other_user_display_name: "Alice",
  other_user_avatar_url: "https://example.com/alice.jpg",
  last_message_body: "Hey there!",
  last_message_at: "2026-03-17T01:00:00Z",
  unread_count: 0,
};

describe("MatchesRow", () => {
  it("renders match photo, name, and last message", () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <MatchesRow thread={mockThread} onPress={onPress} />,
    );

    expect(getByTestId("match-row-thread-1")).toBeTruthy();
    expect(getByTestId("match-avatar-thread-1")).toBeTruthy();
    expect(getByText("Alice")).toBeTruthy();
    expect(getByText("Hey there!")).toBeTruthy();
  });

  it("shows unread indicator when unread > 0", () => {
    const unreadThread: EnrichedThread = {
      ...mockThread,
      unread_count: 3,
    };
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MatchesRow thread={unreadThread} onPress={onPress} />,
    );

    expect(getByTestId("unread-dot")).toBeTruthy();
  });

  it("does not show unread dot when unread is 0", () => {
    const onPress = jest.fn();
    const { queryByTestId } = render(
      <MatchesRow thread={mockThread} onPress={onPress} />,
    );

    expect(queryByTestId("unread-dot")).toBeNull();
  });

  it("shows 'New match! Say hi' when no last message", () => {
    const newMatchThread: EnrichedThread = {
      ...mockThread,
      last_message_body: null,
      last_message_at: null,
    };
    const onPress = jest.fn();
    const { getByText } = render(
      <MatchesRow thread={newMatchThread} onPress={onPress} />,
    );

    expect(getByText("New match! Say hi")).toBeTruthy();
  });

  it("navigates to chat on press", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MatchesRow thread={mockThread} onPress={onPress} />,
    );

    fireEvent.press(getByTestId("match-row-thread-1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
