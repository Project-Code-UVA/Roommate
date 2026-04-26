/**
 * Tests for DeliveryIndicator component.
 * Covers: MSG-03 delivery status icons
 */

import * as React from "react";
import { render, screen } from "@testing-library/react-native";
import { DeliveryIndicator } from "@/components/chat/delivery-indicator";

describe("DeliveryIndicator", () => {
  it("renders clock icon for sending state", () => {
    render(<DeliveryIndicator status="sending" />);
    expect(screen.getByTestId("delivery-sending")).toBeTruthy();
  });

  it("renders single checkmark for sent", () => {
    render(<DeliveryIndicator status="sent" />);
    expect(screen.getByTestId("delivery-sent")).toBeTruthy();
  });

  it("renders double checkmark for delivered", () => {
    render(<DeliveryIndicator status="delivered" />);
    expect(screen.getByTestId("delivery-delivered")).toBeTruthy();
  });

  it("renders blue double checkmark for read", () => {
    render(<DeliveryIndicator status="read" />);
    expect(screen.getByTestId("delivery-read")).toBeTruthy();
  });

  it("renders alert icon for failed", () => {
    render(<DeliveryIndicator status="failed" />);
    expect(screen.getByTestId("delivery-failed")).toBeTruthy();
  });
});
