/**
 * Tests for MessageReplyPreview component.
 * Covers: MSG-05 (reply threading UI)
 */

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { MessageReplyPreview } from "@/components/chat/message-reply-preview";

describe("MessageReplyPreview", () => {
  const defaultProps = {
    originalMessage: {
      body: "This is the original message",
      sender_name: "Alice",
    },
    onPress: jest.fn(),
  };

  it("renders quoted message text", () => {
    render(<MessageReplyPreview {...defaultProps} />);
    expect(screen.getByText("This is the original message")).toBeTruthy();
  });

  it("renders sender name of quoted message", () => {
    render(<MessageReplyPreview {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("truncates long quoted text at 100 chars", () => {
    const longText = "A".repeat(120);
    render(
      <MessageReplyPreview
        originalMessage={{ body: longText, sender_name: "Bob" }}
        onPress={jest.fn()}
      />,
    );
    const truncated = "A".repeat(100) + "...";
    expect(screen.getByText(truncated)).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<MessageReplyPreview {...defaultProps} onPress={onPress} />);
    fireEvent.press(screen.getByText("This is the original message"));
    expect(onPress).toHaveBeenCalled();
  });

  it("handles null body gracefully", () => {
    render(
      <MessageReplyPreview
        originalMessage={{ body: null, sender_name: "Charlie" }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText("Charlie")).toBeTruthy();
  });
});
