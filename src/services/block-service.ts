/**
 * Block service: Block a user from chat or any surface.
 *
 * - blockFromChat: Delegates to unmatchUser with blockToo=true (requires match).
 * - blockUser: Standalone block via block_user RPC (no match required, works from any surface).
 *
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";
import { unmatchUser } from "@/services/match-service";
import type { BlockResult } from "@/types/safety";

// Cast for RPC functions not yet in generated database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

// ---------------------------------------------------------------------------
// Block from chat (requires active match)
// ---------------------------------------------------------------------------

export async function blockFromChat(
  userId: string,
  otherUserId: string,
): Promise<BlockResult> {
  const result = await unmatchUser(userId, otherUserId, true);
  return {
    success: result.success,
    error: result.error,
  };
}

// ---------------------------------------------------------------------------
// Block user from any surface (standalone, no match required)
// ---------------------------------------------------------------------------

export async function blockUser(
  userId: string,
  otherUserId: string,
): Promise<BlockResult> {
  const { data, error } = await rpc("block_user", {
    p_blocker_id: userId,
    p_blocked_id: otherUserId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // RPC returns jsonb with success/error fields
  const result = data as Record<string, unknown>;

  if (result.error) {
    return { success: false, error: result.error as string };
  }

  return { success: true, error: null };
}
