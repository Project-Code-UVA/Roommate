/**
 * Dev-only sample "liked you" profiles for UI preview when there are no real likes.
 * Never used when __DEV__ is false.
 */

import type { LikedMeProfile } from "@/types/explore";

/** Bracket access so Jest can override `process.env` in tests (Metro may inline dotted keys). */
function readMockLikedMeEnv(): string | undefined {
  const v = process.env["EXPO_PUBLIC_DEV_MOCK_LIKED_ME"];
  return typeof v === "string" ? v : undefined;
}

/** Stable placeholder photos (picsum seeds). */
export const DEV_LIKED_ME_STUBS: readonly LikedMeProfile[] = [
  {
    user_id: "__dev_stub_liker_1__",
    photo_url: "https://picsum.photos/seed/room-liker-a/400/580",
    display_name: null,
    liked_at: "2026-04-01T12:00:00.000Z",
  },
  {
    user_id: "__dev_stub_liker_2__",
    photo_url: "https://picsum.photos/seed/room-liker-b/400/580",
    display_name: null,
    liked_at: "2026-04-02T12:00:00.000Z",
  },
  {
    user_id: "__dev_stub_liker_3__",
    photo_url: "https://picsum.photos/seed/room-liker-c/400/580",
    display_name: null,
    liked_at: "2026-04-03T12:00:00.000Z",
  },
];

/**
 * Whether to inject stub liked-me data (only when there is no real inbound data).
 *
 * Expo often **inlines** `EXPO_PUBLIC_*` at bundle time, so we cannot rely on
 * `EXPO_PUBLIC_DEV_MOCK_LIKED_ME === "true"` at runtime. Behavior:
 *
 * - **`__DEV__` + no real likes** (empty list and count 0) → inject stub by default so the
 *   blurred grid is previewable in the simulator.
 * - **`EXPO_PUBLIC_DEV_MOCK_LIKED_ME=false`** → signed-in users see a real empty state (no stub).
 * - **No `userId`** (e.g. dev bypass) → always stub when empty so Likes isn’t blank.
 */
export function shouldInjectDevLikedMeStub(
  userId: string,
  likedMeLength: number,
  likedMeCount: number,
): boolean {
  if (!__DEV__) return false;
  if (likedMeLength > 0 || likedMeCount > 0) return false;

  const noAccount = !userId.trim();
  if (noAccount) return true;

  const flag = readMockLikedMeEnv();
  if (flag === "false") return false;
  return true;
}
