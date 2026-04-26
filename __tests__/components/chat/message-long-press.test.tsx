/**
 * Tests for MessageLongPress component.
 * Covers: Long-press overlay with reactions and action buttons.
 */

import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { MessageLongPress } from "@/components/chat/message-long-press";
import type { Message } from "@/types/chat";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseMessage: Message = {
  id: "msg-1",
  thread_id: "thread-1",
  sender_id: "user-1",
  body: "Hello world",
  media_url: null,
  reply_to_id: null,
  unsent_at: null,
  deleted_for_everyone_at: null,
  deleted_at: null,
  delivered_at: null,
  read_at: null,
  created_at: "2026-03-01T00:00:00Z",
  _status: "sent",
  reply_to: null,
};

const mediaOnlyMessage: Message = {
  ...baseMessage,
  id: "msg-2",
  body: null,
  media_url: "https://example.com/photo.jpg",
};

const defaultProps = {
  currentUserId: "user-2",
  visible: true,
  message: baseMessage,
  reactions: [],
  onReact: jest.fn(),
  onReply: jest.fn(),
  onCopy: jest.fn(),
  onEdit: jest.fn(),
  onUnsend: jest.fn(),
  onDelete: jest.fn(),
  onReport: jest.fn(),
  onClose: jest.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MessageLongPress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when not visible", () => {
    const { queryByTestId } = render(
      <MessageLongPress {...defaultProps} visible={false} />,
    );
    expect(queryByTestId("long-press-overlay")).toBeNull();
  });

  it("renders 6 quick reaction emojis", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    const emojis = ["\u2764\uFE0F", "\uD83D\uDC4D", "\uD83D\uDC4E", "\uD83D\uDE02", "\u203C\uFE0F", "?"];
    emojis.forEach((emoji) => {
      expect(getByText(emoji)).toBeTruthy();
    });
  });

  it("renders Reply action", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    expect(getByText("Reply")).toBeTruthy();
  });

  it("renders Copy text action when message has body", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    expect(getByText("Copy text")).toBeTruthy();
  });

  it("hides Copy text action when message has no body", () => {
    const { queryByText } = render(
      <MessageLongPress {...defaultProps} message={mediaOnlyMessage} />,
    );
    expect(queryByText("Copy text")).toBeNull();
  });

  it("renders Delete for me action", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    expect(getByText("Delete for me")).toBeTruthy();
  });

  it("renders Report message action for non-sender", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    expect(getByText("Report message")).toBeTruthy();
  });

  it("renders Edit and Unsend for sender when allowed", () => {
    const senderMessage = { ...baseMessage, sender_id: "user-2", created_at: new Date().toISOString() };
    const { getByText } = render(
      <MessageLongPress {...defaultProps} currentUserId="user-2" message={senderMessage} />,
    );
    expect(getByText("Edit")).toBeTruthy();
    expect(getByText("Unsend")).toBeTruthy();
  });

  it("calls onReact when emoji tapped", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    fireEvent.press(getByText("\u2764\uFE0F"));
    expect(defaultProps.onReact).toHaveBeenCalledWith("\u2764\uFE0F");
  });

  it("calls onReply when Reply tapped", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    fireEvent.press(getByText("Reply"));
    expect(defaultProps.onReply).toHaveBeenCalledTimes(1);
  });

  it("calls onCopy when Copy text tapped", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    fireEvent.press(getByText("Copy text"));
    expect(defaultProps.onCopy).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when Delete for me tapped", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    fireEvent.press(getByText("Delete for me"));
    expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onReport when Report message tapped", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    fireEvent.press(getByText("Report message"));
    expect(defaultProps.onReport).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop tapped", () => {
    const { getByTestId } = render(<MessageLongPress {...defaultProps} />);
    fireEvent.press(getByTestId("long-press-backdrop"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("hides reply/copy/edit/unsend for unsent message state", () => {
    const unsentMessage = { ...baseMessage, unsent_at: new Date().toISOString() };
    const { queryByText } = render(
      <MessageLongPress {...defaultProps} message={unsentMessage} />,
    );
    expect(queryByText("Reply")).toBeNull();
    expect(queryByText("Copy text")).toBeNull();
    expect(queryByText("Edit")).toBeNull();
    expect(queryByText("Unsend")).toBeNull();
  });
});
