/**
 * Tests for GifSearchPanel component.
 * Covers: MSG-06 GIF search UI with useGifSearch hook.
 */

import * as React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { GifSearchPanel } from "@/components/chat/gif-search-panel";
import type { GifResult } from "@/types/chat";

// ---------------------------------------------------------------------------
// Mock useGifSearch hook
// ---------------------------------------------------------------------------

const mockSearch = jest.fn();
const mockGifResults: readonly GifResult[] = [
  { id: "gif-1", url: "https://giphy.com/1.gif", previewUrl: "https://giphy.com/1_s.gif", width: 200, height: 150 },
  { id: "gif-2", url: "https://giphy.com/2.gif", previewUrl: "https://giphy.com/2_s.gif", width: 200, height: 200 },
];

let mockHookReturn = {
  query: "",
  results: mockGifResults,
  isLoading: false,
  search: mockSearch,
};

jest.mock("@/hooks/use-gif-search", () => ({
  useGifSearch: () => mockHookReturn,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const defaultProps = {
  onSelectGif: jest.fn(),
  onClose: jest.fn(),
  height: 300,
};

describe("GifSearchPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHookReturn = {
      query: "",
      results: mockGifResults,
      isLoading: false,
      search: mockSearch,
    };
  });

  it("renders search input", () => {
    const { getByPlaceholderText } = render(<GifSearchPanel {...defaultProps} />);
    expect(getByPlaceholderText("Search GIFs")).toBeTruthy();
  });

  it("renders GIF grid with results", () => {
    const { getByTestId } = render(<GifSearchPanel {...defaultProps} />);
    expect(getByTestId("gif-cell-gif-1")).toBeTruthy();
    expect(getByTestId("gif-cell-gif-2")).toBeTruthy();
  });

  it("calls search when text input changes", () => {
    const { getByPlaceholderText } = render(<GifSearchPanel {...defaultProps} />);
    fireEvent.changeText(getByPlaceholderText("Search GIFs"), "cats");
    expect(mockSearch).toHaveBeenCalledWith("cats");
  });

  it("calls onSelectGif when a GIF is tapped", () => {
    const { getByTestId } = render(<GifSearchPanel {...defaultProps} />);
    fireEvent.press(getByTestId("gif-cell-gif-1"));
    expect(defaultProps.onSelectGif).toHaveBeenCalledWith(mockGifResults[0]);
  });

  it("shows loading indicator when isLoading", () => {
    mockHookReturn = { ...mockHookReturn, isLoading: true, results: [] };
    const { getByTestId } = render(<GifSearchPanel {...defaultProps} />);
    expect(getByTestId("gif-loading")).toBeTruthy();
  });

  it("shows GIPHY attribution", () => {
    const { getByText } = render(<GifSearchPanel {...defaultProps} />);
    expect(getByText(/Powered by GIPHY/i)).toBeTruthy();
  });
});
