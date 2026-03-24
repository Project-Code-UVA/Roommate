/**
 * Push token service: register and remove Expo push tokens.
 *
 * Tokens are stored per user/device and used by Edge Functions
 * to deliver notifications via the Expo Push API.
 */

import { supabase } from "@/lib/supabase";

// push_tokens table is not in generated types yet (migration 00044)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pushTokens = () => (supabase.from as any)("push_tokens");

type TokenResult = {
  readonly success: boolean;
  readonly error: string | null;
};

/**
 * Register an Expo push token for the current user.
 * Uses upsert to avoid duplicates on re-registration.
 */
export async function registerPushToken(
  userId: string,
  expoPushToken: string,
  platform: "ios" | "android",
): Promise<TokenResult> {
  const { error } = await pushTokens().upsert(
    {
      user_id: userId,
      expo_push_token: expoPushToken,
      platform,
    },
    { onConflict: "user_id,expo_push_token" },
  );

  return {
    success: !error,
    error: error?.message ?? null,
  };
}

/**
 * Remove a push token (e.g., on sign-out or token refresh).
 */
export async function removePushToken(
  userId: string,
  expoPushToken: string,
): Promise<TokenResult> {
  const { error } = await pushTokens()
    .delete()
    .eq("user_id", userId)
    .eq("expo_push_token", expoPushToken);

  return {
    success: !error,
    error: error?.message ?? null,
  };
}
