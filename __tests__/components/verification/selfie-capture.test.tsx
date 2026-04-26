/**
 * Tests for SelfieCapture component.
 * Covers: AUTH-07 (selfie verification UI)
 */

jest.mock("nativewind", () => {
  const { View } = require("react-native");
  return { styled: (c: unknown) => c, StyledComponent: View };
});

jest.mock("@/services/selfie-service", () => ({
  captureSelfie: jest.fn(),
  uploadSelfie: jest.fn(),
}));

import * as React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SelfieCapture } from "@/components/verification/selfie-capture";
import { captureSelfie, uploadSelfie } from "@/services/selfie-service";

const mockCapture = captureSelfie as jest.MockedFunction<typeof captureSelfie>;
const mockUpload = uploadSelfie as jest.MockedFunction<typeof uploadSelfie>;

describe("SelfieCapture", () => {
  const defaultProps = {
    userId: "user-123",
    onComplete: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders capture mode with instructions and shutter button", () => {
    const { getByText, getByTestId } = render(
      <SelfieCapture {...defaultProps} />,
    );

    expect(getByText("Position your face within the frame")).toBeTruthy();
    expect(getByTestId("selfie-shutter")).toBeTruthy();
  });

  it("captures photo on shutter press and shows preview", async () => {
    mockCapture.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://selfie.jpg", width: 100, height: 100, type: "image" }],
    } as never);

    const { getByTestId, getByText } = render(
      <SelfieCapture {...defaultProps} />,
    );

    fireEvent.press(getByTestId("selfie-shutter"));

    await waitFor(() => {
      expect(getByText("Retake")).toBeTruthy();
      expect(getByText("Use Photo")).toBeTruthy();
    });
  });

  it("shows preview with Retake and Use Photo buttons after capture", async () => {
    mockCapture.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://selfie.jpg", width: 100, height: 100, type: "image" }],
    } as never);

    const { getByTestId, getByText, queryByTestId } = render(
      <SelfieCapture {...defaultProps} />,
    );

    fireEvent.press(getByTestId("selfie-shutter"));

    await waitFor(() => {
      expect(getByText("Retake")).toBeTruthy();
      expect(getByText("Use Photo")).toBeTruthy();
      // Shutter should be gone in preview mode
      expect(queryByTestId("selfie-shutter")).toBeNull();
    });
  });

  it("returns to capture mode on Retake press", async () => {
    mockCapture.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://selfie.jpg", width: 100, height: 100, type: "image" }],
    } as never);

    const { getByTestId, getByText } = render(
      <SelfieCapture {...defaultProps} />,
    );

    fireEvent.press(getByTestId("selfie-shutter"));

    await waitFor(() => {
      expect(getByText("Retake")).toBeTruthy();
    });

    fireEvent.press(getByText("Retake"));

    await waitFor(() => {
      expect(getByTestId("selfie-shutter")).toBeTruthy();
    });
  });

  it("calls uploadSelfie and onComplete on Use Photo success", async () => {
    mockCapture.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://selfie.jpg", width: 100, height: 100, type: "image" }],
    } as never);
    mockUpload.mockResolvedValueOnce({ url: "https://cdn/selfie.jpg", error: null });

    const { getByTestId, getByText } = render(
      <SelfieCapture {...defaultProps} />,
    );

    fireEvent.press(getByTestId("selfie-shutter"));

    await waitFor(() => {
      expect(getByText("Use Photo")).toBeTruthy();
    });

    fireEvent.press(getByText("Use Photo"));

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith("user-123", "file://selfie.jpg");
      expect(defaultProps.onComplete).toHaveBeenCalled();
    });
  });

  it("shows error text on upload failure", async () => {
    mockCapture.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: "file://selfie.jpg", width: 100, height: 100, type: "image" }],
    } as never);
    mockUpload.mockResolvedValueOnce({ url: "", error: "Network error" });

    const { getByTestId, getByText } = render(
      <SelfieCapture {...defaultProps} />,
    );

    fireEvent.press(getByTestId("selfie-shutter"));

    await waitFor(() => {
      expect(getByText("Use Photo")).toBeTruthy();
    });

    fireEvent.press(getByText("Use Photo"));

    await waitFor(() => {
      expect(getByText("Upload failed. Please try again.")).toBeTruthy();
    });
  });

  it("does not navigate when capture is canceled", async () => {
    mockCapture.mockResolvedValueOnce({
      canceled: true,
      assets: [],
    } as never);

    const { getByTestId, queryByText } = render(
      <SelfieCapture {...defaultProps} />,
    );

    fireEvent.press(getByTestId("selfie-shutter"));

    await waitFor(() => {
      expect(queryByText("Retake")).toBeNull();
      expect(queryByText("Use Photo")).toBeNull();
    });
  });
});
