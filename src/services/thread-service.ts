/**
 * Thread service: Thread listing, retrieval, and delivery marking.
 *
 * Wraps Supabase queries for thread management.
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Get all threads for a user
// ---------------------------------------------------------------------------

type ThreadsResult = {
  readonly data: readonly Record<string, unknown>[] | null;
  readonly error: string | null;
};

export async function getThreads(userId: string): Promise<ThreadsResult> {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

// ---------------------------------------------------------------------------
// Get single thread by ID
// ---------------------------------------------------------------------------

type ThreadResult = {
  readonly data: Record<string, unknown> | null;
  readonly error: string | null;
};

export async function getThread(threadId: string): Promise<ThreadResult> {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .eq("id", threadId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Record<string, unknown>, error: null };
}

// ---------------------------------------------------------------------------
// Mark all messages in thread as delivered
// ---------------------------------------------------------------------------

type SimpleResult = {
  readonly error: string | null;
};

export async function markThreadDelivered(
  threadId: string,
  userId: string,
): Promise<SimpleResult> {
  const { error } = await supabase
    .from("messages")
    .update({ delivered_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .neq("sender_id", userId)
    .is("delivered_at", null);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
