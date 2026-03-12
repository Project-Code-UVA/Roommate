/**
 * useGifSearch hook: GIF search with debounce and trending on mount.
 *
 * Provides search with 300ms debounce and loads trending on mount.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { searchGifs, trendingGifs } from "@/services/gif-service";
import type { GifResult } from "@/types/chat";

const DEBOUNCE_MS = 300;

type UseGifSearchReturn = {
  readonly query: string;
  readonly results: readonly GifResult[];
  readonly isLoading: boolean;
  readonly search: (term: string) => void;
};

export function useGifSearch(): UseGifSearchReturn {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Load trending on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadTrending() {
      setIsLoading(true);
      const { data } = await trendingGifs();
      setResults(data ?? []);
      setIsLoading(false);
    }

    loadTrending();
  }, []);

  // -------------------------------------------------------------------------
  // Debounced search
  // -------------------------------------------------------------------------

  const search = useCallback((term: string) => {
    setQuery(term);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);

      if (!term.trim()) {
        // Reset to trending
        const { data } = await trendingGifs();
        setResults(data ?? []);
      } else {
        const { data } = await searchGifs(term);
        setResults(data ?? []);
      }

      setIsLoading(false);
    }, DEBOUNCE_MS);
  }, []);

  return { query, results, isLoading, search };
}
