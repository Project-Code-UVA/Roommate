/**
 * Tests for useDiscoveryStack hook.
 * Covers: DISC-01, DISC-02, DISC-03, MTCH-02, MTCH-03.
 *
 * Tests stack management, swipe actions, pagination, match detection,
 * save/unsave, and error handling.
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";

import type { DiscoveryProfile, LikeResult } from "@/types/filters";

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

const mockGetDiscoveryStack = jest.fn();
const mockDismissProfile = jest.fn();
const mockSaveProfile = jest.fn();
const mockUnsaveProfile = jest.fn();

jest.mock("@/services/discovery-service", () => ({
  getDiscoveryStack: (...args: unknown[]) => mockGetDiscoveryStack(...args),
  dismissProfile: (...args: unknown[]) => mockDismissProfile(...args),
  saveProfile: (...args: unknown[]) => mockSaveProfile(...args),
  unsaveProfile: (...args: unknown[]) => mockUnsaveProfile(...args),
}));

const mockLikeProfile = jest.fn();

jest.mock("@/services/match-service", () => ({
  likeProfile: (...args: unknown[]) => mockLikeProfile(...args),
}));

// ---------------------------------------------------------------------------
// Import hook after mocks
// ---------------------------------------------------------------------------

import { useDiscoveryStack } from "@/hooks/use-discovery-stack";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function createMockProfile(
  overrides: Partial<DiscoveryProfile> = {},
): DiscoveryProfile {
  return {
    user_id: `user-${Math.random().toString(36).slice(2, 8)}`,
    display_name: "Test User",
    bio: "Hello there",
    year: "Sophomore",
    hometown: "Austin, TX",
    nitty_gritty: null,
    completion_score: 0.85,
    mode_status: "roommate",
    selfie_verified: false,
    last_active_at: "2026-03-09T00:00:00Z",
    rank_score: 0.75,
    photos: [
      { id: "p1", url: "https://example.com/p1.jpg", position: 0 },
      { id: "p2", url: "https://example.com/p2.jpg", position: 1 },
    ],
    ...overrides,
  };
}

const TEST_USER_ID = "current-user-id";

function createMockProfiles(count: number): readonly DiscoveryProfile[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProfile({ user_id: `user-${i}`, display_name: `User ${i}` }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDiscoveryStack", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetDiscoveryStack.mockResolvedValue({ data: [], error: null });
    mockDismissProfile.mockResolvedValue({ error: null });
    mockSaveProfile.mockResolvedValue({ error: null });
    mockUnsaveProfile.mockResolvedValue({ error: null });
    mockLikeProfile.mockResolvedValue({
      success: true,
      is_match: false,
      is_super_like: false,
      match_id: null,
      thread_id: null,
      error: null,
    } satisfies LikeResult);
  });

  // Stack management

  it("loads initial discovery stack on mount", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetDiscoveryStack).toHaveBeenCalledWith(TEST_USER_ID, 20, 0, {});
    expect(result.current.stack).toEqual(profiles);
  });

  it("returns loading state while fetching", () => {
    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));
    expect(result.current.isLoading).toBe(true);
  });

  it("returns empty state when stack has no profiles", async () => {
    mockGetDiscoveryStack.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isEmpty).toBe(true);
  });

  it("returns error state on fetch failure", async () => {
    mockGetDiscoveryStack.mockResolvedValue({
      data: null,
      error: "Network error",
    });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.error).toBe("Network error");
    });
    expect(result.current.isLoading).toBe(false);
  });

  // Swipe actions -- DISC-01

  it("dismissProfile removes top card from stack", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.dismissCurrent();
    });

    expect(result.current.stack.length).toBe(2);
    expect(result.current.currentProfile).toEqual(profiles[1]);
  });

  it("dismissProfile calls discovery service dismissProfile", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.dismissCurrent();
    });

    expect(mockDismissProfile).toHaveBeenCalledWith(
      TEST_USER_ID,
      profiles[0].user_id,
    );
  });

  it("dismissProfile handles service errors gracefully", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });
    mockDismissProfile.mockResolvedValue({ error: "Server error" });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.dismissCurrent();
    });

    expect(result.current.stack.length).toBe(2);
    await waitFor(() => {
      expect(result.current.error).toBe("Server error");
    });
  });

  // Like actions -- DISC-02

  it("likeProfile removes top card from stack", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.likeCurrent();
    });

    expect(result.current.stack.length).toBe(2);
    expect(result.current.currentProfile).toEqual(profiles[1]);
  });

  it("likeProfile calls match service likeProfile", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.likeCurrent();
    });

    expect(mockLikeProfile).toHaveBeenCalledWith(
      TEST_USER_ID,
      profiles[0].user_id,
    );
  });

  it("likeProfile handles service errors gracefully", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });
    mockLikeProfile.mockResolvedValue({
      success: false,
      is_match: false,
      is_super_like: false,
      match_id: null,
      thread_id: null,
      error: "Rate limited",
    } satisfies LikeResult);

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.likeCurrent();
    });

    expect(result.current.stack.length).toBe(2);
    await waitFor(() => {
      expect(result.current.error).toBe("Rate limited");
    });
  });

  // Save/bookmark -- DISC-03

  it("saveProfile calls discovery service saveProfile", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.saveCurrent();
    });

    expect(mockSaveProfile).toHaveBeenCalledWith(
      TEST_USER_ID,
      profiles[0].user_id,
    );
  });

  it("unsaveProfile calls discovery service unsaveProfile", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.unsaveCurrent();
    });

    expect(mockUnsaveProfile).toHaveBeenCalledWith(
      TEST_USER_ID,
      profiles[0].user_id,
    );
  });

  it("save toggle updates saved state for current profile", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.saveCurrent();
    });

    // Save does not remove card from stack
    expect(result.current.stack.length).toBe(3);
    expect(mockSaveProfile).toHaveBeenCalled();
  });

  // Match detection -- MTCH-02

  it("sets matchData when likeProfile returns is_match true", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });
    mockLikeProfile.mockResolvedValue({
      success: true,
      is_match: true,
      is_super_like: false,
      match_id: "match-123",
      thread_id: "thread-456",
      error: null,
    } satisfies LikeResult);

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.likeCurrent();
    });

    await waitFor(() => {
      expect(result.current.matchData).toEqual({
        matchId: "match-123",
        threadId: "thread-456",
        profile: profiles[0],
      });
    });
  });

  it("does not set matchData when likeProfile returns is_match false", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.likeCurrent();
    });

    await waitFor(() => {
      expect(result.current.stack.length).toBe(2);
    });
    expect(result.current.matchData).toBeNull();
  });

  it("clears matchData when dismissMatch is called", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });
    mockLikeProfile.mockResolvedValue({
      success: true,
      is_match: true,
      is_super_like: false,
      match_id: "match-123",
      thread_id: "thread-456",
      error: null,
    } satisfies LikeResult);

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.likeCurrent();
    });

    await waitFor(() => {
      expect(result.current.matchData).not.toBeNull();
    });

    act(() => {
      result.current.dismissMatch();
    });

    expect(result.current.matchData).toBeNull();
  });

  // Thread auto-creation -- MTCH-03

  it("stores thread_id from likeProfile match response", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });
    mockLikeProfile.mockResolvedValue({
      success: true,
      is_match: true,
      is_super_like: false,
      match_id: "match-abc",
      thread_id: "thread-xyz",
      error: null,
    } satisfies LikeResult);

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(3);
    });

    await act(async () => {
      result.current.likeCurrent();
    });

    await waitFor(() => {
      expect(result.current.matchData?.threadId).toBe("thread-xyz");
    });
  });

  // Pagination

  it("fetches next page when stack length <= 5", async () => {
    // Use PAGE_SIZE (20) so hasReachedEnd stays false
    const initialProfiles = createMockProfiles(20);
    const nextPageProfiles = createMockProfiles(3);
    mockGetDiscoveryStack
      .mockResolvedValueOnce({ data: initialProfiles, error: null })
      .mockResolvedValueOnce({ data: nextPageProfiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(20);
    });

    // Dismiss cards until stack.length <= 5 (triggers pre-fetch)
    for (let i = 0; i < 15; i++) {
      await act(async () => {
        result.current.dismissCurrent();
      });
    }

    await waitFor(() => {
      expect(mockGetDiscoveryStack).toHaveBeenCalledTimes(2);
    });
  });

  it("does not fetch when already loading", async () => {
    const profiles = createMockProfiles(5);
    mockGetDiscoveryStack.mockResolvedValueOnce({
      data: profiles,
      error: null,
    });
    mockGetDiscoveryStack.mockResolvedValueOnce({ data: [], error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await waitFor(() => {
      expect(mockGetDiscoveryStack.mock.calls.length).toBeLessThanOrEqual(2);
    });
  });

  it("appends new profiles to existing stack immutably", async () => {
    // Use PAGE_SIZE (20) so hasReachedEnd stays false
    const initialProfiles = createMockProfiles(20);
    const nextPageProfiles = createMockProfiles(2);
    mockGetDiscoveryStack
      .mockResolvedValueOnce({ data: initialProfiles, error: null })
      .mockResolvedValueOnce({ data: nextPageProfiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.stack.length).toBe(20);
    });

    // Dismiss cards to bring stack to 5 (triggers pagination)
    for (let i = 0; i < 15; i++) {
      await act(async () => {
        result.current.dismissCurrent();
      });
    }

    await waitFor(() => {
      expect(result.current.stack.length).toBe(5 + nextPageProfiles.length);
    });

    // Original remaining profiles still in order
    expect(result.current.stack[0]).toEqual(initialProfiles[15]);
  });

  // Current profile

  it("currentProfile returns first item in stack", async () => {
    const profiles = createMockProfiles(3);
    mockGetDiscoveryStack.mockResolvedValue({ data: profiles, error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.currentProfile).toEqual(profiles[0]);
    });
  });

  it("currentProfile returns null when stack is empty", async () => {
    mockGetDiscoveryStack.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.currentProfile).toBeNull();
  });

  // Return shape

  it("returns all expected properties", async () => {
    mockGetDiscoveryStack.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useDiscoveryStack(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toEqual(
      expect.objectContaining({
        stack: expect.any(Array),
        currentProfile: null,
        isLoading: false,
        isEmpty: true,
        error: null,
        matchData: null,
        dismissCurrent: expect.any(Function),
        likeCurrent: expect.any(Function),
        saveCurrent: expect.any(Function),
        unsaveCurrent: expect.any(Function),
        dismissMatch: expect.any(Function),
      }),
    );
  });
});
