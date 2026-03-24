/**
 * Account service: account deletion and deactivation.
 *
 * PRD: Immediate deactivation, hard delete within 30 days.
 * Reports retained longer for safety compliance.
 */

import { supabase } from "@/lib/supabase";

type DeletionResult = {
  readonly success: boolean;
  readonly error: string | null;
};

/**
 * Request account deletion via server-side RPC.
 * Immediately deactivates (hides from all surfaces), queued for hard delete.
 */
export async function requestAccountDeletion(
  userId: string,
): Promise<DeletionResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("request_account_deletion", {
    p_user_id: userId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  return {
    success: result.success,
    error: result.error ?? null,
  };
}

/**
 * Sign out the current user and clear the session.
 */
export async function signOut(): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}
