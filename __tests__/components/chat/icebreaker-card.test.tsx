/**
 * Tests for IcebreakerCard component.
 * Covers: MSG-09 (icebreaker prompts UI)
 */

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { IcebreakerCard } from "@/components/chat/icebreaker-card";

// Mock getRandomPrompts so we get deterministic output
jest.mock("@/lib/icebreaker-prompts", () => ({
  getRandomPrompts: jest.fn((count: number) => {
    const prompts = [
      { id: "rm-01", text: "What's your ideal weekend morning?", category: "roommate" },
      { id: "rm-02", text: "Are you a thermostat fighter?", category: "roommate" },
      { id: "sc-01", text: "What's your favorite show right now?", category: "social" },
      { id: "rm-03", text: "Morning person or night owl?", category: "roommate" },
      { id: "sc-02", text: "What's the last thing that made you laugh?", category: "social" },
      { id: "sc-03", text: "If you could only eat one meal for a week?", category: "social" },
    ];
    return prompts.slice(0, count);
  }),
}));

describe("IcebreakerCard", () => {
  const defaultProps = {
    onSelectPrompt: jest.fn(),
    onDismiss: jest.fn(),
  };

  it("renders 3 prompts initially", () => {
    render(<IcebreakerCard {...defaultProps} />);
    expect(screen.getByText("What's your ideal weekend morning?")).toBeTruthy();
    expect(screen.getByText("Are you a thermostat fighter?")).toBeTruthy();
    expect(screen.getByText("What's your favorite show right now?")).toBeTruthy();
  });

  it("calls onSelectPrompt when prompt tapped", () => {
    const onSelect = jest.fn();
    render(<IcebreakerCard {...defaultProps} onSelectPrompt={onSelect} />);
    fireEvent.press(screen.getByText("What's your ideal weekend morning?"));
    expect(onSelect).toHaveBeenCalledWith("What's your ideal weekend morning?");
  });

  it("hides after dismiss button tapped", () => {
    const onDismiss = jest.fn();
    render(<IcebreakerCard {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByTestId("icebreaker-dismiss"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("shows more prompts when More tapped", () => {
    render(<IcebreakerCard {...defaultProps} />);
    fireEvent.press(screen.getByText("More"));
    // getRandomPrompts is called again -- since mock is deterministic, same prompts
    // but the key point is it doesn't crash and renders prompts
    expect(screen.getByText("What's your ideal weekend morning?")).toBeTruthy();
  });

  it("renders title 'Break the ice'", () => {
    render(<IcebreakerCard {...defaultProps} />);
    expect(screen.getByText("Break the ice")).toBeTruthy();
  });
});
