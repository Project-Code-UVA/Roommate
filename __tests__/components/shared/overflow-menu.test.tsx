/**
 * Tests for OverflowMenu component.
 * Covers: SAFE-01 (UI component for block/report actions)
 */

jest.mock("nativewind", () => {
  const { View } = require("react-native");
  return { styled: (c: unknown) => c, StyledComponent: View };
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { OverflowMenu } from "@/components/shared/overflow-menu";
import type { OverflowMenuItem } from "@/types/safety";

const mockItems: readonly OverflowMenuItem[] = [
  {
    label: "Block",
    icon: "ban-outline",
    onPress: jest.fn(),
    destructive: true,
  },
  {
    label: "Report",
    icon: "flag-outline",
    onPress: jest.fn(),
  },
];

describe("OverflowMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 3-dot button with correct testID", () => {
    const { getByTestId } = render(<OverflowMenu items={mockItems} />);
    expect(getByTestId("overflow-menu-button")).toBeTruthy();
  });

  it("shows dropdown with items when button pressed", () => {
    const { getByTestId, getByText } = render(
      <OverflowMenu items={mockItems} />,
    );

    fireEvent.press(getByTestId("overflow-menu-button"));

    expect(getByText("Block")).toBeTruthy();
    expect(getByText("Report")).toBeTruthy();
  });

  it("does not show dropdown initially", () => {
    const { queryByText } = render(<OverflowMenu items={mockItems} />);

    expect(queryByText("Block")).toBeNull();
    expect(queryByText("Report")).toBeNull();
  });

  it("closes menu when backdrop pressed", () => {
    const { getByTestId, queryByText } = render(
      <OverflowMenu items={mockItems} />,
    );

    fireEvent.press(getByTestId("overflow-menu-button"));
    expect(queryByText("Block")).toBeTruthy();

    fireEvent.press(getByTestId("overflow-backdrop"));
    expect(queryByText("Block")).toBeNull();
  });

  it("calls onPress for menu item and closes menu", () => {
    const { getByTestId, getByText, queryByText } = render(
      <OverflowMenu items={mockItems} />,
    );

    fireEvent.press(getByTestId("overflow-menu-button"));
    fireEvent.press(getByText("Block"));

    expect(mockItems[0].onPress).toHaveBeenCalledTimes(1);
    // Menu should close after pressing item
    expect(queryByText("Block")).toBeNull();
  });

  it("renders destructive items with red text color", () => {
    const { getByTestId, getByText } = render(
      <OverflowMenu items={mockItems} />,
    );

    fireEvent.press(getByTestId("overflow-menu-button"));

    const blockText = getByText("Block");
    const style = Array.isArray(blockText.props.style)
      ? Object.assign({}, ...blockText.props.style.flat())
      : blockText.props.style;

    expect(style.color).toBe("#ef4444");
  });

  it("supports custom testIDPrefix", () => {
    const { getByTestId } = render(
      <OverflowMenu items={mockItems} testIDPrefix="profile" />,
    );

    expect(getByTestId("profile-overflow")).toBeTruthy();
  });

  it("has correct accessibility attributes", () => {
    const { getByTestId } = render(<OverflowMenu items={mockItems} />);

    const button = getByTestId("overflow-menu-button");
    expect(button.props.accessibilityRole).toBe("button");
    expect(button.props.accessibilityLabel).toBe("More options");
  });
});
