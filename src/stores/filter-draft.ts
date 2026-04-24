import { useSyncExternalStore } from "react";
import type { DiscoveryFilters } from "@/types/filters";

// ---------------------------------------------------------------------------
// Module-level singleton store for filter draft navigation state.
//
// Holds a working copy of filters while the user is on the filter screens,
// plus a callback to apply them back to the originating tab screen.
// ---------------------------------------------------------------------------

type State = {
  readonly draft: DiscoveryFilters;
  readonly onApply: ((filters: DiscoveryFilters) => void) | null;
};

let state: State = { draft: {}, onApply: null };
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

function getSnapshot(): State {
  return state;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function openFilterDraft(
  initial: DiscoveryFilters,
  onApply: (filters: DiscoveryFilters) => void,
): void {
  state = { draft: initial, onApply };
  notify();
}

export function updateFilterDraft(filters: DiscoveryFilters): void {
  state = { ...state, draft: filters };
  notify();
}

export function clearFilterDraft(): void {
  state = { ...state, draft: {} };
  notify();
}

export function applyFilterDraft(): void {
  state.onApply?.(state.draft);
  state = { draft: {}, onApply: null };
  notify();
}

export function useFilterDraft(): State {
  return useSyncExternalStore(subscribe, getSnapshot);
}
