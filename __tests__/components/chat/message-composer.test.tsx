/**
 * Tests for MessageComposer component.
 * Covers: Text input, send button, camera/GIF buttons, reply preview
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { MessageComposer } from "@/components/chat/message-composer";

describe("MessageComposer", () => {
  const defaultProps = {
    onSend: jest.fn(),
    onCameraPress: jest.fn(),
    onGifPress: jest.fn(),
    replyTo: null,
    onDismissReply: jest.fn(),
    disabled: false,
  };

  it("renders text input with placeholder", () => {
    render(<MessageComposer {...defaultProps} />);
    expect(screen.getByPlaceholderText("Type a message...")).toBeTruthy();
  });

  it("send button is disabled when input is empty", () => {
    render(<MessageComposer {...defaultProps} />);
    const sendBtn = screen.getByTestId("composer-send-btn");
    expect(sendBtn.props.accessibilityState?.disabled ?? sendBtn.props.disabled).toBeTruthy();
  });

  it("calls onSend with text and clears input on send", () => {
    const onSend = jest.fn();
    render(<MessageComposer {...defaultProps} onSend={onSend} />);
    const input = screen.getByPlaceholderText("Type a message...");
    fireEvent.changeText(input, "Hello!");
    // send button should now be enabled -- press it
    const sendBtn = screen.getByTestId("composer-send-btn");
    fireEvent.press(sendBtn);
    expect(onSend).toHaveBeenCalledWith("Hello!");
    // input should be cleared
    expect(input.props.value).toBe("");
  });

  it("shows camera and GIF action buttons", () => {
    render(<MessageComposer {...defaultProps} />);
    expect(screen.getByTestId("composer-camera-btn")).toBeTruthy();
    expect(screen.getByTestId("composer-gif-btn")).toBeTruthy();
  });

  it("calls onCameraPress when camera button tapped", () => {
    const onCameraPress = jest.fn();
    render(<MessageComposer {...defaultProps} onCameraPress={onCameraPress} />);
    fireEvent.press(screen.getByTestId("composer-camera-btn"));
    expect(onCameraPress).toHaveBeenCalled();
  });

  it("calls onGifPress when GIF button tapped", () => {
    const onGifPress = jest.fn();
    render(<MessageComposer {...defaultProps} onGifPress={onGifPress} />);
    fireEvent.press(screen.getByTestId("composer-gif-btn"));
    expect(onGifPress).toHaveBeenCalled();
  });

  it("shows reply preview when replyTo is set", () => {
    const replyTo = {
      id: "msg-1",
      thread_id: "t1",
      sender_id: "user-2",
      body: "Original text",
      media_url: null,
      reply_to_id: null,
      delivered_at: null,
      read_at: null,
      created_at: "2026-03-10T12:00:00Z",
      _status: "sent" as const,
      reply_to: null,
    };
    render(<MessageComposer {...defaultProps} replyTo={replyTo} />);
    expect(screen.getByText("Original text")).toBeTruthy();
  });

  it("dismiss button removes reply preview", () => {
    const onDismissReply = jest.fn();
    const replyTo = {
      id: "msg-1",
      thread_id: "t1",
      sender_id: "user-2",
      body: "Original text",
      media_url: null,
      reply_to_id: null,
      delivered_at: null,
      read_at: null,
      created_at: "2026-03-10T12:00:00Z",
      _status: "sent" as const,
      reply_to: null,
    };
    render(
      <MessageComposer
        {...defaultProps}
        replyTo={replyTo}
        onDismissReply={onDismissReply}
      />,
    );
    fireEvent.press(screen.getByTestId("composer-dismiss-reply"));
    expect(onDismissReply).toHaveBeenCalled();
  });
});
