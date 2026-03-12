/**
 * Block service: Block a user from within chat.
 *
 * Delegates to unmatchUser with blockToo=true for server-enforced blocking.
 */

import { unmatchUser } from "@/services/match-service";

// ---------------------------------------------------------------------------
// Block from chat
// ---------------------------------------------------------------------------

type BlockResult = {
  readonly success: boolean;
  readonly error: string | null;
};

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
