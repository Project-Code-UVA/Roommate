/**
 * Likes tab state management hook.
 *
 * Loads matches (via thread service), my-likes, and liked-me sections.
 * Refreshes on tab focus and supports pull-to-refresh.
 *
 * isPaid is hardcoded false — Phase 9 will add subscription check.
 */

import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";

import { getMyLikes, getLikedMe, getLikedMeCount } from "@/services/likes-service";
import { getThreads, type EnrichedThread } from "@/services/thread-service";
import type { LikedMeProfile, MyLike } from "@/types/explore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UseLikesResult = {
  readonly matches: readonly EnrichedThread[];
  readonly myLikes: readonly MyLike[];
  readonly likedMe: readonly LikedMeProfile[];
  readonly likedMeCount: number;
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly refresh: () => Promise<void>;
  readonly isPaid: boolean;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLikes(userId: string): UseLikesResult {
  const [matches, setMatches] = useState<readonly EnrichedThread[]>([]);
  const [myLikes, setMyLikes] = useState<readonly MyLike[]>([]);
  const [likedMe, setLikedMe] = useState<readonly LikedMeProfile[]>([]);
  const [likedMeCount, setLikedMeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // TODO: Phase 9 — check subscription status
  const isPaid = false;

  const loadAll = useCallback(async () => {
    const [threadsResult, myLikesResult, likedMeResult, countResult] =
      await Promise.all([
        getThreads(userId),
        getMyLikes(userId),
        getLikedMe(userId, 24, 0, isPaid),
        getLikedMeCount(userId),
      ]);

    setMatches(threadsResult.data ?? []);
    setMyLikes(myLikesResult.data);
    setLikedMe(likedMeResult.data);
    setLikedMeCount(countResult.count);
  }, [userId, isPaid]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      await loadAll();
      if (!cancelled) {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  // Refresh on tab focus (silent — no loading spinner)
  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll]),
  );

  // Pull-to-refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAll();
    setIsRefreshing(false);
  }, [loadAll]);

  return {
    matches,
    myLikes,
    likedMe,
    likedMeCount,
    isLoading,
    isRefreshing,
    refresh,
    isPaid,
  };
}
