/**
 * Tests for UpgradeBanner component.
 * Covers: LIKE-04 (upgrade CTA for liked-me reveal).
 */

import * as React from "react";
import { Alert } from "react-native";
import { render, fireEvent } from "@testing-library/react-native";

import { UpgradeBanner } from "@/components/likes/upgrade-banner";

describe("UpgradeBanner", () => {
  it("renders upgrade CTA text", () => {
    const { getByTestId, getByText } = render(
      <UpgradeBanner count={5} />,
    );

    expect(getByTestId("upgrade-banner")).toBeTruthy();
    expect(getByText("See who likes you")).toBeTruthy();
    expect(getByText("5 people liked you")).toBeTruthy();
  });

  it("shows singular text for count of 1", () => {
    const { getByText } = render(<UpgradeBanner count={1} />);

    expect(getByText("1 person liked you")).toBeTruthy();
  });

  it("does not show count subtitle when count is 0", () => {
    const { queryByText } = render(<UpgradeBanner count={0} />);

    expect(queryByText(/people liked you/)).toBeNull();
    expect(queryByText(/person liked you/)).toBeNull();
  });

  it("calls onUpgrade when tapped", () => {
    const onUpgrade = jest.fn();
    const { getByTestId } = render(
      <UpgradeBanner count={3} onUpgrade={onUpgrade} />,
    );

    fireEvent.press(getByTestId("upgrade-button"));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it("shows Coming Soon alert when no onUpgrade provided", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { getByTestId } = render(<UpgradeBanner count={3} />);

    fireEvent.press(getByTestId("upgrade-button"));
    expect(alertSpy).toHaveBeenCalledWith(
      "Coming Soon",
      "Premium features launching soon!",
    );

    alertSpy.mockRestore();
  });
});
