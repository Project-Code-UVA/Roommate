/**
 * Tests for MessageReactions component.
 * Covers: MSG-04 (reaction pills UI)
 */

import React from "react";
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
      <MessageReactions reactions={reactions} onReactionPress={jest.fn()} />,
    );
    expect(screen.getByText("thumbsup")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("heart")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("calls onReactionPress when pill tapped", () => {
    const onPress = jest.fn();
    const reactions: readonly MessageReaction[] = [
      makeReaction("thumbsup"),
    ];
    render(
      <MessageReactions reactions={reactions} onReactionPress={onPress} />,
    );
    fireEvent.press(screen.getByText("thumbsup"));
    expect(onPress).toHaveBeenCalledWith("thumbsup");
  });

  it("renders nothing when no reactions", () => {
    const { toJSON } = render(
      <MessageReactions reactions={[]} onReactionPress={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });
});
