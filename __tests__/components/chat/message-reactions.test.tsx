/**
 * Tests for MessageReactions component.
 * Covers: MSG-04 (reaction pills UI)
 */

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { MessageReactions } from "@/components/chat/message-reactions";
import type { MessageReaction } from "@/types/chat";

const makeReaction = (
  emoji: string,
  userId: string = "user-1",
): MessageReaction => ({
  id: `r-${emoji}-${userId}`,
  message_id: "msg-1",
  user_id: userId,
  emoji,
  created_at: new Date().toISOString(),
});

describe("MessageReactions", () => {
  it("renders reaction pills with emoji and count", () => {
    const reactions: readonly MessageReaction[] = [
      makeReaction("thumbsup", "user-1"),
      makeReaction("thumbsup", "user-2"),
      makeReaction("heart", "user-3"),
    ];
    render(
      <MessageReactions
        reactions={reactions}
        currentUserId="user-9"
        onToggle={jest.fn()}
        isSender={false}
      />,
    );
    expect(screen.getByText("thumbsup")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("heart")).toBeTruthy();
  });

  it("calls onToggle when pill tapped", () => {
    const onPress = jest.fn();
    const reactions: readonly MessageReaction[] = [
      makeReaction("thumbsup"),
    ];
    render(
      <MessageReactions
        reactions={reactions}
        currentUserId="user-9"
        onToggle={onPress}
        isSender={false}
      />,
    );
    fireEvent.press(screen.getByText("thumbsup"));
    expect(onPress).toHaveBeenCalledWith("thumbsup", null);
  });

  it("renders nothing when no reactions", () => {
    const { toJSON } = render(
      <MessageReactions
        reactions={[]}
        currentUserId="user-9"
        onToggle={jest.fn()}
        isSender={false}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});
