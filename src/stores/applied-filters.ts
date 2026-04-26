import { useSyncExternalStore } from "react";

import type { DiscoveryFilters } from "@/types/filters";

// Singleton store of *applied* filters shared across Discovery and Explore.
// Setting filters in one tab updates the other.

let state: DiscoveryFilters = {};
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

function getSnapshot(): DiscoveryFilters {
  return state;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setAppliedFilters(filters: DiscoveryFilters): void {
  state = filters;
  notify();
}

export function getAppliedFilters(): DiscoveryFilters {
  return state;
}

export function useAppliedFilters(): DiscoveryFilters {
  return useSyncExternalStore(subscribe, getSnapshot);
}
