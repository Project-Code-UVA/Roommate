/**
 * GIF service: GIPHY API wrapper for search and trending.
 *
 * Uses GIPHY REST API with EXPO_PUBLIC_GIPHY_API_KEY env var.
 * Returns structured results mapped to GifResult type.
 */

import type { GifResult } from "@/types/chat";

const GIPHY_BASE_URL = "https://api.giphy.com/v1/gifs";
const API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY ?? "";

// ---------------------------------------------------------------------------
// Map GIPHY response to GifResult
// ---------------------------------------------------------------------------

type GiphyImage = {
  readonly url: string;
  readonly width: string;
  readonly height: string;
};

type GiphyItem = {
  readonly id: string;
  readonly images: {
    readonly original: GiphyImage;
    readonly fixed_width_small: { readonly url: string };
  };
};

function mapToGifResult(item: GiphyItem): GifResult {
  return {
    id: item.id,
    url: item.images.original.url,
    previewUrl: item.images.fixed_width_small.url,
    width: parseInt(item.images.original.width, 10),
    height: parseInt(item.images.original.height, 10),
  };
}

// ---------------------------------------------------------------------------
// Search GIFs
// ---------------------------------------------------------------------------

type GifServiceResult = {
  readonly data: readonly GifResult[] | null;
  readonly error: string | null;
};

export async function searchGifs(
  query: string,
  offset = 0,
  limit = 20,
): Promise<GifServiceResult> {
  try {
    const params = new URLSearchParams({
      api_key: API_KEY,
      q: query,
      limit: String(limit),
      offset: String(offset),
      rating: "pg-13",
    });

    const response = await fetch(`${GIPHY_BASE_URL}/search?${params}`);

    if (!response.ok) {
      return {
        data: null,
        error: `GIPHY API error: ${response.status} ${response.statusText}`,
      };
    }

    const json = await response.json();
    const results = (json.data as readonly GiphyItem[]).map(mapToGifResult);

    return { data: results, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "GIF search failed";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Trending GIFs
// ---------------------------------------------------------------------------

export async function trendingGifs(
  offset = 0,
  limit = 20,
): Promise<GifServiceResult> {
  try {
    const params = new URLSearchParams({
      api_key: API_KEY,
      limit: String(limit),
      offset: String(offset),
      rating: "pg-13",
    });

    const response = await fetch(`${GIPHY_BASE_URL}/trending?${params}`);

    if (!response.ok) {
      return {
        data: null,
        error: `GIPHY API error: ${response.status} ${response.statusText}`,
      };
    }

    const json = await response.json();
    const results = (json.data as readonly GiphyItem[]).map(mapToGifResult);

    return { data: results, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Trending GIFs failed";
    return { data: null, error: message };
  }
}
