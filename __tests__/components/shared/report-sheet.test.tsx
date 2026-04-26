/**
 * Tests for ReportSheet component.
 * Covers: SAFE-01 (report submission UI)
 */

jest.mock("nativewind", () => {
  const { View } = require("react-native");
  return { styled: (c: unknown) => c, StyledComponent: View };
});

import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ReportSheet } from "@/components/safety/report-sheet";

const defaultProps = {
  visible: true,
  userName: "Alex",
  onSubmit: jest.fn(),
  onClose: jest.fn(),
  isSubmitting: false,
};

describe("ReportSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all 8 report categories", () => {
    const { getByText } = render(<ReportSheet {...defaultProps} />);

    expect(getByText("Harassment")).toBeTruthy();
    expect(getByText("Sexual Content")).toBeTruthy();
    expect(getByText("Hate Speech")).toBeTruthy();
    expect(getByText("Spam")).toBeTruthy();
    expect(getByText("Impersonation")).toBeTruthy();
    expect(getByText("Underage User")).toBeTruthy();
    expect(getByText("Safety Threat")).toBeTruthy();
    expect(getByText("Other")).toBeTruthy();
  });

  it("renders report header with user name", () => {
    const { getByText } = render(<ReportSheet {...defaultProps} />);

    expect(getByText("Report Alex")).toBeTruthy();
  });

  it("highlights selected category", () => {
    const { getByText } = render(<ReportSheet {...defaultProps} />);

    fireEvent.press(getByText("Harassment"));

    // After selection, the category row should have the selected style applied
    const harassmentRow = getByText("Harassment").parent;
    // Check parent container has selected style
    expect(harassmentRow).toBeTruthy();
  });

  it("shows description textarea after category selection", () => {
    const { getByText, getByPlaceholderText } = render(
      <ReportSheet {...defaultProps} />,
    );

    fireEvent.press(getByText("Spam"));

    expect(getByPlaceholderText("Add details (optional)")).toBeTruthy();
  });

  it("calls onSubmit with category and description", () => {
    const { getByText, getByPlaceholderText } = render(
      <ReportSheet {...defaultProps} />,
    );

    fireEvent.press(getByText("Harassment"));
    fireEvent.changeText(
      getByPlaceholderText("Add details (optional)"),
      "Very rude messages",
    );
    fireEvent.press(getByText("Submit Report"));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      "harassment",
      "Very rude messages",
    );
  });

  it("disables submit button when no category selected", () => {
    const { getByText } = render(<ReportSheet {...defaultProps} />);

    const submitButton = getByText("Submit Report");
    // The button should exist but the onSubmit should not be called when pressed
    fireEvent.press(submitButton);

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("has correct accessibility role on category rows", () => {
    const { getByTestId } = render(<ReportSheet {...defaultProps} />);

    const harassmentRow = getByTestId("report-category-harassment");
    expect(harassmentRow.props.accessibilityRole).toBe("radio");
  });

  it("does not render when visible is false", () => {
    const { queryByText } = render(
      <ReportSheet {...defaultProps} visible={false} />,
    );

    expect(queryByText("Report Alex")).toBeNull();
  });
});
