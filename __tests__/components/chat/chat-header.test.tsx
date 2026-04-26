/**
 * Tests for ChatHeader component.
 * Covers: Chat header with avatar, name, back button, overflow menu with Block/Report.
 */

import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { ChatHeader } from "@/components/chat/chat-header";
import type { ThreadUser } from "@/types/chat";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const otherUser: ThreadUser = {
  id: "user-2",
  display_name: "Jane Doe",
  avatar_url: "https://example.com/avatar.jpg",
};

const noAvatarUser: ThreadUser = {
  id: "user-3",
  display_name: "No Avatar User",
  avatar_url: null,
};

const defaultProps = {
  otherUser,
  onPressProfile: jest.fn(),
  onPressBlock: jest.fn(),
  onPressReport: jest.fn(),
  onBack: jest.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChatHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders display name", () => {
    const { getByText } = render(<ChatHeader {...defaultProps} />);
    expect(getByText("Jane Doe")).toBeTruthy();
  });

  it("renders avatar image when avatar_url provided", () => {
    const { getByTestId } = render(<ChatHeader {...defaultProps} />);
    expect(getByTestId("chat-header-avatar")).toBeTruthy();
  });

  it("renders fallback icon when no avatar_url", () => {
    const { getByTestId } = render(
      <ChatHeader {...defaultProps} otherUser={noAvatarUser} />,
    );
    expect(getByTestId("chat-header-avatar-fallback")).toBeTruthy();
  });

  it("calls onBack when back button pressed", () => {
    const { getByTestId } = render(<ChatHeader {...defaultProps} />);
    fireEvent.press(getByTestId("chat-header-back"));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("calls onPressProfile when avatar tapped", () => {
    const { getByTestId } = render(<ChatHeader {...defaultProps} />);
    fireEvent.press(getByTestId("chat-header-profile"));
    expect(defaultProps.onPressProfile).toHaveBeenCalledTimes(1);
  });

  it("shows overflow menu button", () => {
    const { getByTestId } = render(<ChatHeader {...defaultProps} />);
    expect(getByTestId("chat-header-overflow")).toBeTruthy();
  });

  it("shows Block and Report options when overflow menu opened", () => {
    const { getByTestId, getByText } = render(<ChatHeader {...defaultProps} />);
    fireEvent.press(getByTestId("chat-header-overflow"));
    expect(getByText("Block")).toBeTruthy();
    expect(getByText("Report")).toBeTruthy();
  });

  it("calls onPressBlock when Block selected", () => {
    const { getByTestId, getByText } = render(<ChatHeader {...defaultProps} />);
    fireEvent.press(getByTestId("chat-header-overflow"));
    fireEvent.press(getByText("Block"));
    expect(defaultProps.onPressBlock).toHaveBeenCalledTimes(1);
  });

  it("calls onPressReport when Report selected", () => {
    const { getByTestId, getByText } = render(<ChatHeader {...defaultProps} />);
    fireEvent.press(getByTestId("chat-header-overflow"));
    fireEvent.press(getByText("Report"));
    expect(defaultProps.onPressReport).toHaveBeenCalledTimes(1);
  });

  it("closes overflow menu when an option is selected", () => {
    const { getByTestId, getByText, queryByText } = render(
      <ChatHeader {...defaultProps} />,
    );
    fireEvent.press(getByTestId("chat-header-overflow"));
    expect(getByText("Block")).toBeTruthy();
    fireEvent.press(getByText("Block"));
    // Menu should close after selection
    expect(queryByText("Block")).toBeNull();
  });
});
