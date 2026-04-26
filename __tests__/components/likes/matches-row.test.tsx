/**
 * Tests for MatchesRow component.
 * Covers: LIKE-01 (matches display in likes tab).
 */

import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { MatchesRow } from "@/components/likes/matches-row";
import type { EnrichedThread } from "@/services/thread-service";
import type { Message } from "@/types/chat";

const mockLastMessage: Message = {
  id: "msg-1",
  thread_id: "thread-1",
  sender_id: "other-1",
  body: "Hey there!",
  media_url: null,
  reply_to_id: null,
  unsent_at: null,
  deleted_for_everyone_at: null,
  deleted_at: null,
  delivered_at: null,
  read_at: null,
  edited_at: null,
  created_at: "2026-03-17T01:00:00Z",
  _status: "sent",
  reply_to: null,
};

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
  last_message: mockLastMessage,
  unread_count: 0,
};

describe("MatchesRow", () => {
  it("renders match photo, name, and last message", () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(
      <MatchesRow thread={mockThread} currentUserId="me" onPress={onPress} />,
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
      <MatchesRow thread={unreadThread} currentUserId="me" onPress={onPress} />,
    );

    expect(getByTestId("unread-dot")).toBeTruthy();
  });

  it("does not show unread dot when unread is 0", () => {
    const onPress = jest.fn();
    const { queryByTestId } = render(
      <MatchesRow thread={mockThread} currentUserId="me" onPress={onPress} />,
    );

    expect(queryByTestId("unread-dot")).toBeNull();
  });

  it("shows 'New match! Say hi' when no last message", () => {
    const newMatchThread: EnrichedThread = {
      ...mockThread,
      last_message_body: null,
      last_message_at: null,
      last_message: null,
    };
    const onPress = jest.fn();
    const { getByText } = render(
      <MatchesRow thread={newMatchThread} currentUserId="me" onPress={onPress} />,
    );

    expect(getByText("No messages yet")).toBeTruthy();
  });

  it("navigates to chat on press", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <MatchesRow thread={mockThread} currentUserId="me" onPress={onPress} />,
    );

    fireEvent.press(getByTestId("match-row-thread-1"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
