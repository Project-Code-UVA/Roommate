/**
 * Tests for MessageBubble component.
 * Covers: Bubble rendering, sender/receiver variants, media, delivery, reactions, reply
 */

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { MessageBubble } from "@/components/chat/message-bubble";
import type { Message, MessageReaction } from "@/types/chat";

const baseMessage: Message = {
  id: "msg-1",
  thread_id: "thread-1",
  sender_id: "user-1",
  body: "Hello world",
  media_url: null,
  reply_to_id: null,
  delivered_at: "2026-03-10T12:00:00Z",
  read_at: null,
  created_at: "2026-03-10T12:00:00Z",
  _status: "delivered",
  reply_to: null,
};

describe("MessageBubble", () => {
  const defaultProps = {
    message: baseMessage,
    isSender: true,
    isLastInCluster: false,
    reactions: [] as readonly MessageReaction[],
    onLongPress: jest.fn(),
    onImagePress: jest.fn(),
    onReactionPress: jest.fn(),
    onReplyPress: jest.fn(),
  };

  it("renders message body text", () => {
    render(<MessageBubble {...defaultProps} />);
    expect(screen.getByText("Hello world")).toBeTruthy();
  });

  it("renders sender bubble with testID", () => {
    render(<MessageBubble {...defaultProps} isSender={true} />);
    expect(screen.getByTestId("bubble-sender")).toBeTruthy();
  });

  it("renders receiver bubble with testID", () => {
    render(<MessageBubble {...defaultProps} isSender={false} />);
    expect(screen.getByTestId("bubble-receiver")).toBeTruthy();
  });

  it("shows delivery indicator for sender messages", () => {
    render(<MessageBubble {...defaultProps} isSender={true} />);
    expect(screen.getByTestId("delivery-delivered")).toBeTruthy();
  });

  it("does not show delivery indicator for receiver messages", () => {
    render(<MessageBubble {...defaultProps} isSender={false} />);
    expect(screen.queryByTestId("delivery-delivered")).toBeNull();
  });

  it("renders media image when media_url is present", () => {
    const msg = { ...baseMessage, media_url: "https://example.com/photo.jpg" };
    render(<MessageBubble {...defaultProps} message={msg} />);
    expect(screen.getByTestId("bubble-media-image")).toBeTruthy();
  });

  it("calls onLongPress on long press gesture", () => {
    const onLongPress = jest.fn();
    render(<MessageBubble {...defaultProps} onLongPress={onLongPress} />);
    fireEvent(screen.getByTestId("bubble-sender"), "longPress");
    expect(onLongPress).toHaveBeenCalled();
  });

  it("renders reactions when provided", () => {
    const reactions: readonly MessageReaction[] = [
      {
        id: "r1",
        message_id: "msg-1",
        user_id: "user-2",
        emoji: "heart",
        created_at: "2026-03-10T12:01:00Z",
      },
    ];
    render(<MessageBubble {...defaultProps} reactions={reactions} />);
    expect(screen.getByText("heart")).toBeTruthy();
  });

  it("renders reply preview when reply_to exists", () => {
    const msg: Message = {
      ...baseMessage,
      reply_to_id: "msg-0",
      reply_to: {
        ...baseMessage,
        id: "msg-0",
        body: "Original message",
        sender_id: "user-2",
      },
    };
    render(<MessageBubble {...defaultProps} message={msg} />);
    expect(screen.getByText("Original message")).toBeTruthy();
  });
});
