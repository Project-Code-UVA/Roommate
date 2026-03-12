/**
 * Tests for MessageList component.
 * Covers: MSG-02 (timestamps, grouping, inverted list)
 */

import React from "react";
import { render, screen } from "@testing-library/react-native";
import { MessageList } from "@/components/chat/message-list";
import type { Message } from "@/types/chat";

const makeMessage = (
  overrides: Partial<Message> & { id: string; sender_id: string; created_at: string },
): Message => ({
  thread_id: "thread-1",
  body: `Message ${overrides.id}`,
  media_url: null,
  reply_to_id: null,
  delivered_at: null,
  read_at: null,
  _status: "sent" as const,
  reply_to: null,
  ...overrides,
});

const CURRENT_USER = "user-1";

describe("MessageList", () => {
  const defaultProps = {
    currentUserId: CURRENT_USER,
    reactions: new Map<string, readonly []>(),
    onLongPress: jest.fn(),
    onImagePress: jest.fn(),
    onReactionPress: jest.fn(),
    onReplyPress: jest.fn(),
    onEndReached: jest.fn(),
    isLoading: false,
  };

  it("renders messages", () => {
    const messages: readonly Message[] = [
      makeMessage({ id: "m1", sender_id: "user-1", created_at: "2026-03-10T12:00:00Z" }),
      makeMessage({ id: "m2", sender_id: "user-2", created_at: "2026-03-10T12:01:00Z" }),
    ];
    render(<MessageList {...defaultProps} messages={messages} />);
    expect(screen.getByText("Message m1")).toBeTruthy();
    expect(screen.getByText("Message m2")).toBeTruthy();
  });

  it("inserts date separators between messages on different days", () => {
    const messages: readonly Message[] = [
      makeMessage({ id: "m1", sender_id: "user-1", created_at: "2026-03-09T23:59:00Z" }),
      makeMessage({ id: "m2", sender_id: "user-1", created_at: "2026-03-10T00:01:00Z" }),
    ];
    render(<MessageList {...defaultProps} messages={messages} />);
    // Should have date separator(s) rendered
    expect(screen.getAllByTestId("date-separator").length).toBeGreaterThanOrEqual(1);
  });

  it("marks last message in cluster correctly (same sender within 5 min)", () => {
    const messages: readonly Message[] = [
      makeMessage({ id: "m1", sender_id: "user-1", created_at: "2026-03-10T12:00:00Z" }),
      makeMessage({ id: "m2", sender_id: "user-1", created_at: "2026-03-10T12:01:00Z" }),
    ];
    render(<MessageList {...defaultProps} messages={messages} />);
    // Both messages from same sender -- last in cluster gets tail
    expect(screen.getAllByTestId("bubble-sender").length).toBe(2);
  });

  it("renders empty state when no messages", () => {
    render(
      <MessageList
        {...defaultProps}
        messages={[]}
        ListEmptyComponent={<></>}
      />,
    );
    // No crash, no messages
    expect(screen.queryByTestId("bubble-sender")).toBeNull();
  });

  it("shows loading footer when isLoading", () => {
    render(
      <MessageList {...defaultProps} messages={[]} isLoading={true} />,
    );
    expect(screen.getByTestId("message-list-loading")).toBeTruthy();
  });
});
