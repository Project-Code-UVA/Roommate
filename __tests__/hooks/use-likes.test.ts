/**
 * Tests for useLikes hook.
 * Covers: LIKE-01, LIKE-02, LIKE-03, LIKE-04 (my likes, liked me, matches).
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";

import type { LikedMeProfile, MyLike } from "@/types/explore";
import type { EnrichedThread } from "@/services/thread-service";

// ---------------------------------------------------------------------------
// Mock services
// ---------------------------------------------------------------------------

const mockGetMyLikes = jest.fn();
const mockGetLikedMe = jest.fn();
const mockGetLikedMeCount = jest.fn();

jest.mock("@/services/likes-service", () => ({
  getMyLikes: (...args: unknown[]) => mockGetMyLikes(...args),
  getLikedMe: (...args: unknown[]) => mockGetLikedMe(...args),
  getLikedMeCount: (...args: unknown[]) => mockGetLikedMeCount(...args),
}));

const mockGetThreads = jest.fn();

jest.mock("@/services/thread-service", () => ({
  getThreads: (...args: unknown[]) => mockGetThreads(...args),
}));

// Mock expo-router useFocusEffect
const mockUseFocusEffect = jest.fn((cb: () => void) => {
  // Call immediately on mount like the real useFocusEffect
  cb();
});

jest.mock("expo-router", () => ({
  useFocusEffect: (cb: () => void) => mockUseFocusEffect(cb),
}));

// ---------------------------------------------------------------------------
// Import hook after mocks
// ---------------------------------------------------------------------------

import { useLikes } from "@/hooks/use-likes";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_USER_ID = "test-user-id";

const mockThread: EnrichedThread = {
  id: "thread-1",
  user_a_id: TEST_USER_ID,
  user_b_id: "other-1",
  match_id: "match-1",
  status: "active",
  created_at: "2026-03-17T00:00:00Z",
  other_user_id: "other-1",
  other_user_display_name: "Alice",
  other_user_avatar_url: "https://example.com/alice.jpg",
  last_message_body: "Hey there!",
  last_message_at: "2026-03-17T01:00:00Z",
  unread_count: 2,
};

const mockMyLike: MyLike = {
  user_id: "liked-1",
  display_name: "Bob",
  year: "Sophomore",
  photo_url: "https://example.com/bob.jpg",
  liked_at: "2026-03-16T00:00:00Z",
};

const mockLikedMe: LikedMeProfile = {
  user_id: "liker-1",
  photo_url: "https://example.com/liker.jpg",
  display_name: null,
  liked_at: "2026-03-15T00:00:00Z",
};

function setupDefaultMocks() {
  mockGetThreads.mockResolvedValue({ data: [mockThread], error: null });
  mockGetMyLikes.mockResolvedValue({ data: [mockMyLike], error: null });
  mockGetLikedMe.mockResolvedValue({ data: [mockLikedMe], error: null });
  mockGetLikedMeCount.mockResolvedValue({ count: 3, error: null });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useLikes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_DEV_MOCK_LIKED_ME = "false";
    setupDefaultMocks();
  });

  it("loads matches from thread service on mount", async () => {
    const { result } = renderHook(() => useLikes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetThreads).toHaveBeenCalledWith(TEST_USER_ID);
    expect(result.current.matches).toEqual([mockThread]);
  });

  it("loads my likes on mount", async () => {
    const { result } = renderHook(() => useLikes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetMyLikes).toHaveBeenCalledWith(TEST_USER_ID);
    expect(result.current.myLikes).toEqual([mockMyLike]);
  });

  it("loads liked me with isPaid=false (free user)", async () => {
    const { result } = renderHook(() => useLikes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetLikedMe).toHaveBeenCalledWith(TEST_USER_ID, 24, 0, false);
    expect(result.current.likedMe).toEqual([mockLikedMe]);
    expect(result.current.isPaid).toBe(false);
  });

  it("loads liked-me count for badge", async () => {
    const { result } = renderHook(() => useLikes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetLikedMeCount).toHaveBeenCalledWith(TEST_USER_ID);
    expect(result.current.likedMeCount).toBe(3);
  });

  it("refreshes all data via refresh()", async () => {
    const { result } = renderHook(() => useLikes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    jest.clearAllMocks();
    setupDefaultMocks();

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockGetThreads).toHaveBeenCalled();
    expect(mockGetMyLikes).toHaveBeenCalled();
    expect(mockGetLikedMe).toHaveBeenCalled();
    expect(mockGetLikedMeCount).toHaveBeenCalled();
  });

  it("calls useFocusEffect for silent refresh on tab focus", () => {
    renderHook(() => useLikes(TEST_USER_ID));

    expect(mockUseFocusEffect).toHaveBeenCalled();
  });

  it("handles null threads data gracefully", async () => {
    mockGetThreads.mockResolvedValue({ data: null, error: "failed" });

    const { result } = renderHook(() => useLikes(TEST_USER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.matches).toEqual([]);
  });

  it("injects dev stub liked-me when userId is empty and there are no likes", async () => {
    mockGetThreads.mockResolvedValue({ data: [], error: null });
    mockGetMyLikes.mockResolvedValue({ data: [], error: null });
    mockGetLikedMe.mockResolvedValue({ data: [], error: null });
    mockGetLikedMeCount.mockResolvedValue({ count: 0, error: null });

    const { result } = renderHook(() => useLikes(""));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.likedMe).toHaveLength(3);
    expect(result.current.likedMeCount).toBe(3);
    expect(result.current.likedMeIsDevStub).toBe(true);
  });

});
