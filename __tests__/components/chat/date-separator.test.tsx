/**
 * Tests for DateSeparator component.
 * Covers: MSG-02 (date display between groups)
 */

import * as React from "react";
import { render, screen } from "@testing-library/react-native";
import { DateSeparator } from "@/components/chat/date-separator";

describe("DateSeparator", () => {
  it("renders 'Today' for today's date", () => {
    const today = new Date().toISOString();
    render(<DateSeparator date={today} />);
    expect(screen.getByText("Today")).toBeTruthy();
  });

  it("renders 'Yesterday' for yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    render(<DateSeparator date={yesterday} />);
    expect(screen.getByText("Yesterday")).toBeTruthy();
  });

  it("renders 'Mon DD' format for older dates this year", () => {
    const currentYear = new Date().getFullYear();
    const oldDate = new Date(currentYear, 0, 15).toISOString(); // Jan 15 this year
    render(<DateSeparator date={oldDate} />);
    expect(screen.getByText("Jan 15")).toBeTruthy();
  });

  it("renders 'Mon DD, YYYY' format for dates in previous years", () => {
    const oldDate = new Date(2025, 2, 9).toISOString(); // Mar 9, 2025
    render(<DateSeparator date={oldDate} />);
    expect(screen.getByText("Mar 9, 2025")).toBeTruthy();
  });
});
