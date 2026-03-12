/**
 * Tests for gif-service.
 * Covers: MSG-07
 */

import { resetAllMocks } from "../setup";
import { searchGifs, trendingGifs } from "@/services/gif-service";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_GIPHY_RESPONSE = {
  data: [
    {
      id: "gif-1",
      images: {
        original: { url: "https://giphy.com/gif1.gif", width: "480", height: "360" },
        fixed_width_small: { url: "https://giphy.com/gif1-preview.gif" },
      },
    },
    {
      id: "gif-2",
      images: {
        original: { url: "https://giphy.com/gif2.gif", width: "320", height: "240" },
        fixed_width_small: { url: "https://giphy.com/gif2-preview.gif" },
      },
    },
  ],
};

describe("gif-service", () => {
  beforeEach(() => {
    resetAllMocks();
    mockFetch.mockReset();
  });

  describe("searchGifs", () => {
    it("calls GIPHY search endpoint with query", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GIPHY_RESPONSE),
      });

      await searchGifs("funny cat");

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/search");
      expect(url).toContain("q=funny+cat");
      expect(url).toContain("rating=pg-13");
    });

    it("returns GifResult[] on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GIPHY_RESPONSE),
      });

      const result = await searchGifs("test");

      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual({
        id: "gif-1",
        url: "https://giphy.com/gif1.gif",
        previewUrl: "https://giphy.com/gif1-preview.gif",
        width: 480,
        height: 360,
      });
      expect(result.error).toBeNull();
    });

    it("handles API error gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await searchGifs("test");

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it("returns empty array for no results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const result = await searchGifs("xyznonexistent");

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe("trendingGifs", () => {
    it("calls GIPHY trending endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GIPHY_RESPONSE),
      });

      await trendingGifs();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("/trending");
      expect(url).toContain("rating=pg-13");
    });

    it("returns GifResult[] on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GIPHY_RESPONSE),
      });

      const result = await trendingGifs();

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });
  });
});
