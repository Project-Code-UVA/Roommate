/**
 * Discovery stack state management hook.
 *
 * Manages the swipe deck: loading, pagination, optimistic swipe actions,
 * match detection, and save/unsave operations.
 *
 * All state updates are immutable. API calls are fire-and-forget after
 * optimistic UI updates to keep swiping fast.
 */

import { useState, useEffect, useCallback, useRef } from "react";

import {
  getDiscoveryStack,
  dismissProfile,
  saveProfile,
  unsaveProfile,
} from "@/services/discovery-service";
import { likeProfile } from "@/services/match-service";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MatchData = {
  readonly matchId: string;
  readonly threadId: string;
  readonly profile: DiscoveryProfile;
};

type DiscoveryStackState = {
  readonly stack: readonly DiscoveryProfile[];
  readonly currentProfile: DiscoveryProfile | null;
  readonly isLoading: boolean;
  readonly isEmpty: boolean;
  readonly error: string | null;
  readonly matchData: MatchData | null;
  readonly dismissCurrent: () => void;
  readonly likeCurrent: () => void;
  readonly saveCurrent: () => void;
  readonly unsaveCurrent: () => void;
  readonly dismissMatch: () => void;
  readonly refresh: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;
const PREFETCH_THRESHOLD = 5;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDiscoveryStack(userId: string): DiscoveryStackState {
  const [stack, setStack] = useState<readonly DiscoveryProfile[]>([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);

  // Track whether a pagination fetch is in progress to avoid duplicates
  const isFetchingMore = useRef(false);
  // Track whether initial load has completed
  const hasLoadedInitial = useRef(false);
  // Track whether we've reached end of available profiles
  const hasReachedEnd = useRef(false);

  // -------------------------------------------------------------------------
  // Initial load
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setIsLoading(true);
      setError(null);

      const result = await getDiscoveryStack(userId, PAGE_SIZE, 0);

      if (cancelled) return;

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      const profiles = result.data ?? [];
      setStack(profiles);
      setOffset(profiles.length);
      setIsLoading(false);
      hasLoadedInitial.current = true;

      if (profiles.length < PAGE_SIZE) {
        hasReachedEnd.current = true;
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // -------------------------------------------------------------------------
  // Pagination: pre-fetch when stack runs low
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!hasLoadedInitial.current) return;
    if (isLoading) return;
    if (isFetchingMore.current) return;
    if (hasReachedEnd.current) return;
    if (stack.length > PREFETCH_THRESHOLD) return;

    let cancelled = false;
    isFetchingMore.current = true;

    async function fetchMore() {
      const result = await getDiscoveryStack(userId, PAGE_SIZE, offset);

      if (cancelled) {
        isFetchingMore.current = false;
        return;
      }

      isFetchingMore.current = false;

      if (result.error) {
        // Don't overwrite existing stack on pagination error
        return;
      }

      const newProfiles = result.data ?? [];

      if (newProfiles.length === 0 || newProfiles.length < PAGE_SIZE) {
        hasReachedEnd.current = true;
      }

      if (newProfiles.length > 0) {
        setStack((prev) => [...prev, ...newProfiles]);
        setOffset((prev) => prev + newProfiles.length);
      }
    }

    fetchMore();

    return () => {
      cancelled = true;
    };
  }, [stack.length, isLoading, offset, userId]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const currentProfile = stack.length > 0 ? stack[0] : null;
  const isEmpty = !isLoading && stack.length === 0;

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const dismissCurrent = useCallback(() => {
    if (stack.length === 0) return;

    const dismissed = stack[0];

    // Optimistic: remove card immediately
    setStack((prev) => prev.slice(1));

    // Fire API call asynchronously
    dismissProfile(userId, dismissed.user_id).then((result) => {
      if (result.error) {
        setError(result.error);
      }
    });
  }, [stack, userId]);

  const likeCurrent = useCallback(() => {
    if (stack.length === 0) return;

    const liked = stack[0];

    // Optimistic: remove card immediately
    setStack((prev) => prev.slice(1));

    // Fire API call asynchronously
    likeProfile(userId, liked.user_id).then((result) => {
      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.is_match && result.match_id && result.thread_id) {
        setMatchData({
          matchId: result.match_id,
          threadId: result.thread_id,
          profile: liked,
        });
      }
    });
  }, [stack, userId]);

  const saveCurrent = useCallback(() => {
    if (stack.length === 0) return;

    const saved = stack[0];

    saveProfile(userId, saved.user_id).then((result) => {
      if (result.error) {
        setError(result.error);
      }
    });
  }, [stack, userId]);

  const unsaveCurrent = useCallback(() => {
    if (stack.length === 0) return;

    const current = stack[0];

    unsaveProfile(userId, current.user_id).then((result) => {
      if (result.error) {
        setError(result.error);
      }
    });
  }, [stack, userId]);

  const dismissMatch = useCallback(() => {
    setMatchData(null);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    hasReachedEnd.current = false;

    const result = await getDiscoveryStack(userId, PAGE_SIZE, 0);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    const profiles = result.data ?? [];
    setStack(profiles);
    setOffset(profiles.length);
    setIsLoading(false);

    if (profiles.length < PAGE_SIZE) {
      hasReachedEnd.current = true;
    }
  }, [userId]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    stack,
    currentProfile,
    isLoading,
    isEmpty,
    error,
    matchData,
    dismissCurrent,
    likeCurrent,
    saveCurrent,
    unsaveCurrent,
    dismissMatch,
    refresh,
  };
}
