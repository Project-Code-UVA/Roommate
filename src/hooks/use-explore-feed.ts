/**
 * Explore feed state management hook.
 *
 * Manages the grid feed: loading, pagination with seed-based shuffle,
 * profile selection, and optimistic like/dismiss actions.
 *
 * All state updates are immutable (spread/filter, never mutate).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";

import { getExploreFeed, getProfileDetail } from "@/services/explore-service";
import { likeProfile } from "@/services/match-service";
import { dismissProfile } from "@/services/discovery-service";
import type { ExploreProfile } from "@/types/explore";
import type { DiscoveryProfile, LikeResult } from "@/types/filters";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 24;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MatchData = {
  readonly matchId: string;
  readonly threadId: string;
  readonly profile: DiscoveryProfile;
};

type ExploreFeedState = {
  readonly profiles: readonly ExploreProfile[];
  readonly selectedProfile: DiscoveryProfile | null;
  readonly nextProfile: DiscoveryProfile | null;
  readonly selectedExploreProfile: ExploreProfile | null;
  readonly isLoading: boolean;
  readonly isRefreshing: boolean;
  readonly hasMore: boolean;
  readonly matchData: MatchData | null;
  readonly loadMore: () => Promise<void>;
  readonly refresh: () => Promise<void>;
  readonly selectProfile: (profile: ExploreProfile) => Promise<void>;
  readonly likeSelected: () => Promise<LikeResult | null>;
  readonly dismissSelected: () => Promise<void>;
  readonly clearSelected: () => void;
  readonly dismissMatch: () => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExploreFeed(userId: string): ExploreFeedState {
  const [profiles, setProfiles] = useState<readonly ExploreProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<DiscoveryProfile | null>(null);
  const [nextProfile, setNextProfile] = useState<DiscoveryProfile | null>(null);
  const [selectedExploreProfile, setSelectedExploreProfile] = useState<ExploreProfile | null>(null);
  const selectedIndexRef = useRef(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [matchData, setMatchData] = useState<MatchData | null>(null);

  const seedRef = useRef(Math.floor(Math.random() * 2147483647));
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setIsLoading(true);

      const result = await getExploreFeed(userId, PAGE_SIZE, 0, seedRef.current);

      if (cancelled) return;

      const items = result.data;
      setProfiles(items);
      offsetRef.current = items.length;
      setHasMore(items.length >= PAGE_SIZE);
      setIsLoading(false);
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // -------------------------------------------------------------------------
  // Load more (infinite scroll)
  // -------------------------------------------------------------------------

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;

    isFetchingRef.current = true;

    const result = await getExploreFeed(
      userId,
      PAGE_SIZE,
      offsetRef.current,
      seedRef.current,
    );

    isFetchingRef.current = false;

    const newItems = result.data;

    if (newItems.length < PAGE_SIZE) {
      setHasMore(false);
    }

    if (newItems.length > 0) {
      setProfiles((prev) => [...prev, ...newItems]);
      offsetRef.current = offsetRef.current + newItems.length;
    }
  }, [userId, hasMore]);

  // -------------------------------------------------------------------------
  // Refresh (pull-to-refresh with new seed)
  // -------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    setIsRefreshing(true);

    seedRef.current = Math.floor(Math.random() * 2147483647);
    offsetRef.current = 0;

    const result = await getExploreFeed(userId, PAGE_SIZE, 0, seedRef.current);

    const items = result.data;
    setProfiles(items);
    offsetRef.current = items.length;
    setHasMore(items.length >= PAGE_SIZE);
    setIsRefreshing(false);
  }, [userId]);

  // -------------------------------------------------------------------------
  // Pre-fetch next profile detail from the grid
  // -------------------------------------------------------------------------

  const prefetchNext = useCallback(
    async (currentIndex: number) => {
      // Find the next profile in the grid after currentIndex
      const nextIdx = currentIndex + 1;
      if (nextIdx >= profiles.length) {
        setNextProfile(null);
        return;
      }

      const nextGridProfile = profiles[nextIdx];
      if (!nextGridProfile) {
        setNextProfile(null);
        return;
      }

      try {
        const result = await getProfileDetail(userId, nextGridProfile.user_id);
        if (result.data) {
          setNextProfile(result.data);
        } else {
          setNextProfile(null);
        }
      } catch {
        setNextProfile(null);
      }
    },
    [userId, profiles],
  );

  // -------------------------------------------------------------------------
  // Profile selection
  // -------------------------------------------------------------------------

  const selectProfile = useCallback(
    async (profile: ExploreProfile) => {
      setSelectedExploreProfile(profile);

      // Find index in grid
      const idx = profiles.findIndex((p) => p.user_id === profile.user_id);
      selectedIndexRef.current = idx;

      try {
        const result = await getProfileDetail(userId, profile.user_id);

        if (result.error) {
          setSelectedExploreProfile(null);
          Alert.alert("Error", "Could not load profile. Please try again.");
          return;
        }

        if (result.data) {
          setSelectedProfile(result.data);
          // Pre-fetch the next profile in the background
          prefetchNext(idx);
        } else {
          setSelectedExploreProfile(null);
          Alert.alert("Error", "Profile is no longer available.");
        }
      } catch {
        setSelectedExploreProfile(null);
        Alert.alert("Error", "Could not load profile. Please try again.");
      }
    },
    [userId, profiles, prefetchNext],
  );

  const clearSelected = useCallback(() => {
    setSelectedProfile(null);
    setNextProfile(null);
    setSelectedExploreProfile(null);
    selectedIndexRef.current = -1;
  }, []);

  // -------------------------------------------------------------------------
  // Like selected profile
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Advance to next profile in stack
  // -------------------------------------------------------------------------

  const advanceStack = useCallback(() => {
    if (nextProfile) {
      // Next becomes current
      setSelectedProfile(nextProfile);
      setNextProfile(null);

      // Find the next profile's index in grid by user_id
      const nextIdx = profiles.findIndex((p) => p.user_id === nextProfile.user_id);
      selectedIndexRef.current = nextIdx >= 0 ? nextIdx : selectedIndexRef.current + 1;

      // Update the selected explore profile reference
      const nextExplore = nextIdx >= 0 ? profiles[nextIdx] : null;
      setSelectedExploreProfile(nextExplore ?? null);

      // Pre-fetch the one after that
      prefetchNext(selectedIndexRef.current);
    } else {
      // No more profiles queued — close modal
      setSelectedProfile(null);
      setSelectedExploreProfile(null);
      selectedIndexRef.current = -1;
    }
  }, [nextProfile, profiles, prefetchNext]);

  // -------------------------------------------------------------------------
  // Like selected profile
  // -------------------------------------------------------------------------

  const likeSelected = useCallback(async (): Promise<LikeResult | null> => {
    if (!selectedExploreProfile || !selectedProfile) return null;

    const targetId = selectedExploreProfile.user_id;
    const profile = selectedProfile;

    // Optimistic: remove from feed and advance stack
    setProfiles((prev) => prev.filter((p) => p.user_id !== targetId));
    advanceStack();

    const result = await likeProfile(userId, targetId);

    if (result.is_match && result.match_id && result.thread_id) {
      setMatchData({
        matchId: result.match_id,
        threadId: result.thread_id,
        profile,
      });
    }

    return result;
  }, [userId, selectedExploreProfile, selectedProfile, advanceStack]);

  // -------------------------------------------------------------------------
  // Dismiss selected profile
  // -------------------------------------------------------------------------

  const dismissSelected = useCallback(async () => {
    if (!selectedExploreProfile) return;

    const targetId = selectedExploreProfile.user_id;

    // Optimistic: remove from feed and advance stack
    setProfiles((prev) => prev.filter((p) => p.user_id !== targetId));
    advanceStack();

    await dismissProfile(userId, targetId);
  }, [userId, selectedExploreProfile, advanceStack]);

  // -------------------------------------------------------------------------
  // Match dismissal
  // -------------------------------------------------------------------------

  const dismissMatch = useCallback(() => {
    setMatchData(null);
  }, []);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    profiles,
    selectedProfile,
    nextProfile,
    selectedExploreProfile,
    isLoading,
    isRefreshing,
    hasMore,
    matchData,
    loadMore,
    refresh,
    selectProfile,
    likeSelected,
    dismissSelected,
    clearSelected,
    dismissMatch,
  };
}
