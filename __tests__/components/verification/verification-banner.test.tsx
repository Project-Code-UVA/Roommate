/**
 * Tests for VerificationBanner component.
 * Covers: AUTH-07 (verification prompt banner)
 */

jest.mock("nativewind", () => {
  const { View } = require("react-native");
  return { styled: (c: unknown) => c, StyledComponent: View };
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { VerificationBanner } from "@/components/verification/verification-banner";

describe("VerificationBanner", () => {
  const defaultProps = {
    onVerify: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders banner with heading and body text", () => {
    const { getByText } = render(<VerificationBanner {...defaultProps} />);

    expect(getByText("Build trust with verification")).toBeTruthy();
    expect(
      getByText(
        "Take a quick selfie to get a verified badge on your profile.",
      ),
    ).toBeTruthy();
  });

  it("renders Verify Now CTA button", () => {
    const { getByText } = render(<VerificationBanner {...defaultProps} />);

    expect(getByText("Verify Now")).toBeTruthy();
  });

  it("calls onVerify when CTA pressed", () => {
    const { getByText } = render(<VerificationBanner {...defaultProps} />);

    fireEvent.press(getByText("Verify Now"));

    expect(defaultProps.onVerify).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when X pressed", () => {
    const { getByTestId } = render(<VerificationBanner {...defaultProps} />);

    fireEvent.press(getByTestId("verification-banner-dismiss"));

    expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1);
  });

  it("has testID on banner container", () => {
    const { getByTestId } = render(<VerificationBanner {...defaultProps} />);

    expect(getByTestId("verification-banner")).toBeTruthy();
  });
});
