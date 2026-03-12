/**
 * Tests for useGifSearch hook.
 * Covers: MSG-07
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { resetAllMocks } from "../setup";

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

const mockSearchGifs = jest.fn();
const mockTrendingGifs = jest.fn();

jest.mock("@/services/gif-service", () => ({
  searchGifs: (...args: unknown[]) => mockSearchGifs(...args),
  trendingGifs: (...args: unknown[]) => mockTrendingGifs(...args),
}));

// ---------------------------------------------------------------------------
// Import hook after mocks
// ---------------------------------------------------------------------------

import { useGifSearch } from "@/hooks/use-gif-search";

const MOCK_GIFS = [
  { id: "gif-1", url: "https://giphy.com/1.gif", previewUrl: "https://giphy.com/1-s.gif", width: 480, height: 360 },
  { id: "gif-2", url: "https://giphy.com/2.gif", previewUrl: "https://giphy.com/2-s.gif", width: 320, height: 240 },
];

describe("useGifSearch", () => {
  beforeEach(() => {
    resetAllMocks();
    mockSearchGifs.mockReset();
    mockTrendingGifs.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("loads trending GIFs on mount", async () => {
    mockTrendingGifs.mockResolvedValueOnce({ data: MOCK_GIFS, error: null });

    const { result } = renderHook(() => useGifSearch());

    // Advance past any timers
    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockTrendingGifs).toHaveBeenCalled();
    expect(result.current.results).toHaveLength(2);
  });

  it("debounces search by 300ms", async () => {
    mockTrendingGifs.mockResolvedValueOnce({ data: [], error: null });
    mockSearchGifs.mockResolvedValueOnce({ data: MOCK_GIFS, error: null });

    const { result } = renderHook(() => useGifSearch());

    // Wait for trending to load
    await act(async () => {
      jest.runAllTimers();
    });

    // Trigger search
    act(() => {
      result.current.search("funny");
    });

    // Should NOT have called search yet (debounced)
    expect(mockSearchGifs).not.toHaveBeenCalled();

    // Advance 300ms
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearchGifs).toHaveBeenCalledWith("funny");
    });
  });

  it("resets to trending when query cleared", async () => {
    mockTrendingGifs.mockResolvedValue({ data: MOCK_GIFS, error: null });
    mockSearchGifs.mockResolvedValueOnce({ data: [MOCK_GIFS[0]], error: null });

    const { result } = renderHook(() => useGifSearch());

    await act(async () => {
      jest.runAllTimers();
    });

    // Search first
    act(() => {
      result.current.search("test");
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Clear search
    act(() => {
      result.current.search("");
    });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Should call trending again
    expect(mockTrendingGifs).toHaveBeenCalledTimes(2);
  });

  it("exposes query, results, isLoading, search", () => {
    mockTrendingGifs.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useGifSearch());

    expect(result.current).toHaveProperty("query");
    expect(result.current).toHaveProperty("results");
    expect(result.current).toHaveProperty("isLoading");
    expect(typeof result.current.search).toBe("function");
  });
});
