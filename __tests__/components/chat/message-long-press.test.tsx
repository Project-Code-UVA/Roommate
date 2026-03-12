/**
 * Tests for MessageLongPress component.
 * Covers: Long-press overlay with reactions and action buttons.
 */

import React from "react";
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
  visible: true,
  message: baseMessage,
  onReact: jest.fn(),
  onReply: jest.fn(),
  onCopy: jest.fn(),
  onDelete: jest.fn(),
  onReport: jest.fn(),
  onOpenEmojiPicker: jest.fn(),
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
    const emojis = ["\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDC4D", "\uD83D\uDE2E", "\uD83D\uDE22", "\uD83D\uDD25"];
    emojis.forEach((emoji) => {
      expect(getByText(emoji)).toBeTruthy();
    });
  });

  it("renders plus button for emoji picker", () => {
    const { getByTestId } = render(<MessageLongPress {...defaultProps} />);
    expect(getByTestId("emoji-picker-btn")).toBeTruthy();
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

  it("renders Report message action", () => {
    const { getByText } = render(<MessageLongPress {...defaultProps} />);
    expect(getByText("Report message")).toBeTruthy();
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

  it("calls onOpenEmojiPicker when plus button tapped", () => {
    const { getByTestId } = render(<MessageLongPress {...defaultProps} />);
    fireEvent.press(getByTestId("emoji-picker-btn"));
    expect(defaultProps.onOpenEmojiPicker).toHaveBeenCalledTimes(1);
  });
});
