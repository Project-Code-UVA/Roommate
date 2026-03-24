/**
 * Tests for VerificationSettingsRow component.
 * Covers: AUTH-07 (settings row for selfie verification status)
 */

jest.mock("nativewind", () => {
  const { View } = require("react-native");
  return { styled: (c: unknown) => c, StyledComponent: View };
});

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { VerificationSettingsRow } from "@/components/verification/verification-settings-row";

describe("VerificationSettingsRow", () => {
  const defaultProps = {
    isVerified: false,
    onVerify: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows 'Verify Identity' label when unverified", () => {
    const { getByText } = render(
      <VerificationSettingsRow {...defaultProps} />,
    );

    expect(getByText("Verify Identity")).toBeTruthy();
  });

  it("shows 'Not verified' detail when unverified", () => {
    const { getByText } = render(
      <VerificationSettingsRow {...defaultProps} />,
    );

    expect(getByText("Not verified")).toBeTruthy();
  });

  it("shows 'Re-upload Selfie' label when verified", () => {
    const { getByText } = render(
      <VerificationSettingsRow {...defaultProps} isVerified={true} />,
    );

    expect(getByText("Re-upload Selfie")).toBeTruthy();
  });

  it("shows 'Verified' detail in green when verified", () => {
    const { getByText } = render(
      <VerificationSettingsRow {...defaultProps} isVerified={true} />,
    );

    expect(getByText("Verified")).toBeTruthy();
  });

  it("calls onVerify when pressed", () => {
    const { getByTestId } = render(
      <VerificationSettingsRow {...defaultProps} />,
    );

    fireEvent.press(getByTestId("verification-settings-row"));

    expect(defaultProps.onVerify).toHaveBeenCalledTimes(1);
  });
});
