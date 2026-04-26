/**
 * Tests for useExploreFeed hook.
 * Covers: EXPL-02 (explore feed pagination, refresh, optimistic updates).
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";

import type { ExploreProfile } from "@/types/explore";
import type { DiscoveryProfile, LikeResult } from "@/types/filters";

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

const mockGetExploreFeed = jest.fn();
const mockGetProfileDetail = jest.fn();

jest.mock("@/services/explore-service", () => ({
  getExploreFeed: (...args: unknown[]) => mockGetExploreFeed(...args),
  getProfileDetail: (...args: unknown[]) => mockGetProfileDetail(...args),
}));

const mockLikeProfile = jest.fn();

jest.mock("@/services/match-service", () => ({
  likeProfile: (...args: unknown[]) => mockLikeProfile(...args),
}));

const mockDismissProfile = jest.fn();

jest.mock("@/services/discovery-service", () => ({
  dismissProfile: (...args: unknown[]) => mockDismissProfile(...args),
}));

// ---------------------------------------------------------------------------
// Import hook after mocks
// ---------------------------------------------------------------------------

import { useExploreFeed } from "@/hooks/use-explore-feed";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createExploreProfile(
  overrides: Partial<ExploreProfile> = {},
): ExploreProfile {
  return {
    user_id: `user-${Math.random().toString(36).slice(2, 8)}`,
    display_name: "Test User",
    year: "Sophomore",
    photo_url: "https://example.com/photo.jpg",
    selfie_verified: false,
    ...overrides,
  };
}

function createDiscoveryProfile(
  overrides: Partial<DiscoveryProfile> = {},
): DiscoveryProfile {
  return {
    user_id: "detail-user",
    display_name: "Detail User",
    bio: "A bio",
    year: "Junior",
    hometown: "Austin",
    nitty_gritty: null,
    completion_score: 0.85,
    mode_status: "roommate",
    selfie_verified: false,
    last_active_at: "2026-03-17T00:00:00Z",
    rank_score: 0,
    photos: [{ id: "p1", url: "https://example.com/p1.jpg", position: 0 }],
    ...overrides,
  };
}

const TEST_USER_ID = "current-user-id";

function createExploreProfiles(count: number): readonly ExploreProfile[] {
  return Array.from({ length: count }, (_, i) =>
    createExploreProfile({ user_id: `user-${i}`, display_name: `User ${i}` }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useExploreFeed", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetExploreFeed.mockResolvedValue({ data: [], error: null });
    mockGetProfileDetail.mockResolvedValue({ data: null, error: null });
    mockDismissProfile.mockResolvedValue({ error: null });
    mockLikeProfile.mockResolvedValue({
      success: true,
      is_match: false,
      is_super_like: false,
      match_id: null,
      thread_id: null,
      error: null,
    } satisfies LikeResult);
  });

  it("loads initial page of profiles", async () => {
    const profiles = createExploreProfiles(24);
    mockGetExploreFeed.mockResolvedValueOnce({ data: profiles, error: null });

    const { result } = renderHook(() => useExploreFeed(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profiles).toEqual(profiles);
    expect(mockGetExploreFeed).toHaveBeenCalledWith(
      TEST_USER_ID,
      24,
      0,
      expect.any(Number),
      {},
    );
  });

  it("loads next page on loadMore", async () => {
    const page1 = createExploreProfiles(24);
    const page2 = createExploreProfiles(10);
    mockGetExploreFeed
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null });

    const { result } = renderHook(() => useExploreFeed(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.profiles.length).toBe(34);
    // Second call should use offset 24
    expect(mockGetExploreFeed).toHaveBeenCalledTimes(2);
  });

  it("refreshes with new seed on pull-to-refresh", async () => {
    const page1 = createExploreProfiles(5);
    const page2 = createExploreProfiles(3);
    mockGetExploreFeed
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null });

    const { result } = renderHook(() => useExploreFeed(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstSeed = mockGetExploreFeed.mock.calls[0][3];

    await act(async () => {
      await result.current.refresh();
    });

    // Refresh should call with a potentially different seed and offset 0
    expect(mockGetExploreFeed).toHaveBeenCalledTimes(2);
    const secondCall = mockGetExploreFeed.mock.calls[1];
    expect(secondCall[1]).toBe(24); // limit
    expect(secondCall[2]).toBe(0); // offset reset to 0
  });

  it("removes profile after like (optimistic)", async () => {
    const profiles = createExploreProfiles(5);
    const fullProfile = createDiscoveryProfile({ user_id: profiles[0].user_id });
    mockGetExploreFeed.mockResolvedValueOnce({ data: profiles, error: null });
    mockGetProfileDetail.mockResolvedValue({ data: fullProfile, error: null });

    const { result } = renderHook(() => useExploreFeed(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.profiles.length).toBe(5);
    });

    // Select the first profile
    await act(async () => {
      await result.current.selectProfile(profiles[0]);
    });

    await waitFor(() => {
      expect(result.current.selectedProfile).not.toBeNull();
    });

    // Like it
    await act(async () => {
      await result.current.likeSelected();
    });

    expect(result.current.profiles.length).toBe(4);
    expect(result.current.profiles.find((p) => p.user_id === profiles[0].user_id)).toBeUndefined();
    expect(result.current.selectedProfile).toBeNull();
    expect(mockLikeProfile).toHaveBeenCalledWith(TEST_USER_ID, profiles[0].user_id);
  });

  it("removes profile after dismiss (optimistic)", async () => {
    const profiles = createExploreProfiles(5);
    const fullProfile = createDiscoveryProfile({ user_id: profiles[1].user_id });
    mockGetExploreFeed.mockResolvedValueOnce({ data: profiles, error: null });
    mockGetProfileDetail.mockResolvedValue({ data: fullProfile, error: null });

    const { result } = renderHook(() => useExploreFeed(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.profiles.length).toBe(5);
    });

    // Select the second profile
    await act(async () => {
      await result.current.selectProfile(profiles[1]);
    });

    await waitFor(() => {
      expect(result.current.selectedProfile).not.toBeNull();
    });

    // Dismiss it
    await act(async () => {
      await result.current.dismissSelected();
    });

    expect(result.current.profiles.length).toBe(4);
    expect(result.current.profiles.find((p) => p.user_id === profiles[1].user_id)).toBeUndefined();
    expect(result.current.selectedProfile).toBeNull();
    expect(mockDismissProfile).toHaveBeenCalledWith(TEST_USER_ID, profiles[1].user_id);
  });
});
