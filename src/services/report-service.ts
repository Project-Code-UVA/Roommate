/**
 * Report service: Submit user reports from chat.
 *
 * Inserts into reports table with category validation.
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";
import type { ReportCategory } from "@/types/chat";

// ---------------------------------------------------------------------------
// Submit report
// ---------------------------------------------------------------------------

type ReportResult = {
  readonly success: boolean;
  readonly error: string | null;
};

export async function submitReport(
  reporterId: string,
  reportedId: string,
  category: ReportCategory,
  description?: string,
): Promise<ReportResult> {
  const { error } = await supabase.from("reports").insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason: category,
    details: description ?? null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
