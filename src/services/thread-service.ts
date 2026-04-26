/**
 * Thread service: Thread listing, retrieval, and delivery marking.
 *
 * Wraps Supabase queries for thread management.
 * All functions return structured error objects (never throw).
 */

import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { getLatestVisibleMessageForUser } from "@/services/thread-preview";
import type { Message } from "@/types/chat";

const HIDDEN_MESSAGES_KEY = "room:hidden_messages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnrichedThread = {
  readonly id: string;
  readonly user_a_id: string;
  readonly user_b_id: string;
  readonly match_id: string;
  readonly status: string;
  readonly created_at: string;
  readonly other_user_id: string;
  readonly other_user_display_name: string;
  readonly other_user_avatar_url: string | null;
  readonly last_message_body: string | null;
  readonly last_message_at: string | null;
  readonly last_message: Message | null;
  readonly unread_count: number;
};

// ---------------------------------------------------------------------------
// Get all threads for a user (enriched with profile, avatar, last message)
// ---------------------------------------------------------------------------

type ThreadsResult = {
  readonly data: readonly EnrichedThread[] | null;
  readonly error: string | null;
};

export async function getThreads(userId: string): Promise<ThreadsResult> {
  // 1. Fetch raw threads
  const { data: threads, error } = await supabase
    .from("threads")
    .select("*")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !threads) {
    return { data: null, error: error?.message ?? "Failed to fetch threads" };
  }

  if (threads.length === 0) {
    return { data: [], error: null };
  }

  // 2. Collect other user IDs and thread IDs
  const otherUserIds = threads.map((t: Record<string, unknown>) =>
    t.user_a_id === userId ? (t.user_b_id as string) : (t.user_a_id as string),
  );
  const threadIds = threads.map((t: Record<string, unknown>) => t.id as string);

  // 3. Fetch profiles, primary photos, last messages, and unread counts in parallel
  const [profilesRes, photosRes, messagesRes, unreadRes, hiddenIdsRaw] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", otherUserIds),
    supabase
      .from("photos")
      .select("user_id, url")
      .in("user_id", otherUserIds)
      .eq("order_index", 0),
    supabase
      .from("messages")
      .select("*")


      .in("thread_id", threadIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("messages")
      .select("thread_id", { count: "exact", head: false })
      .in("thread_id", threadIds)
      .neq("sender_id", userId)
      .is("read_at", null),
    AsyncStorage.getItem(HIDDEN_MESSAGES_KEY),
  ]);

  // 4. Check for errors in parallel fetches
  if (profilesRes.error) return { data: null, error: profilesRes.error.message };
  if (messagesRes.error) return { data: null, error: messagesRes.error.message };

  // 5. Build lookup maps
  const profileMap = new Map(
    (profilesRes.data ?? []).map((p: Record<string, unknown>) => [
      p.user_id as string,
      p.display_name as string,
    ]),
  );

  const photoMap = new Map(
    (photosRes.data ?? []).map((p: Record<string, unknown>) => [
      p.user_id as string,
      p.url as string,
    ]),
  );


  // Last message per thread (first occurrence wins since sorted desc)
  const hiddenMessageIds = new Set<string>(hiddenIdsRaw ? JSON.parse(hiddenIdsRaw) : []);
  const threadMessagesMap = new Map<string, Message[]>();
  for (const msg of (messagesRes.data ?? []) as readonly Message[]) {
    const existing = threadMessagesMap.get(msg.thread_id) ?? [];
    threadMessagesMap.set(msg.thread_id, [...existing, { ...msg, _status: "sent", reply_to: null }]);
  }

  // Unread count per thread
  const unreadMap = new Map<string, number>();
  for (const row of (unreadRes.data ?? []) as readonly Record<string, unknown>[]) {
    const tid = row.thread_id as string;
    unreadMap.set(tid, (unreadMap.get(tid) ?? 0) + 1);
  }

  // 5. Enrich threads and sort by last activity
  const enriched: EnrichedThread[] = threads.map(
    (t: Record<string, unknown>) => {
      const otherUserId =
        t.user_a_id === userId
          ? (t.user_b_id as string)
          : (t.user_a_id as string);
      const messagesForThread = threadMessagesMap.get(t.id as string) ?? [];
      const lastMsg = getLatestVisibleMessageForUser(
        messagesForThread,
        userId,
        hiddenMessageIds,
      );

      return {
        id: t.id as string,
        user_a_id: t.user_a_id as string,
        user_b_id: t.user_b_id as string,
        match_id: t.match_id as string,
        status: t.status as string,
        created_at: t.created_at as string,
        other_user_id: otherUserId,
        other_user_display_name: profileMap.get(otherUserId) ?? "Unknown",
        other_user_avatar_url: photoMap.get(otherUserId) ?? null,
        last_message_body: lastMsg?.body ?? null,
        last_message_at: lastMsg?.created_at ?? (t.created_at as string),
        last_message: lastMsg,
        unread_count: unreadMap.get(t.id as string) ?? 0,
      };
    },
  );

  // Sort by most recent activity (last message or thread creation)
  enriched.sort(
    (a, b) =>
      new Date(b.last_message_at ?? b.created_at).getTime() -
      new Date(a.last_message_at ?? a.created_at).getTime(),
  );

  return { data: enriched, error: null };
}

// ---------------------------------------------------------------------------
// Get total unread message count across all threads (for tab badge)
// ---------------------------------------------------------------------------

type UnreadCountResult = {
  readonly count: number;
  readonly error: string | null;
};

export async function getTotalUnreadCount(
  userId: string,
): Promise<UnreadCountResult> {
  // Get active thread IDs for this user
  const { data: threads, error: threadError } = await supabase
    .from("threads")
    .select("id")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .eq("status", "active");

  if (threadError || !threads) {
    return { count: 0, error: threadError?.message ?? null };
  }

  if (threads.length === 0) {
    return { count: 0, error: null };
  }

  const threadIds = threads.map((t: Record<string, unknown>) => t.id as string);

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .in("thread_id", threadIds)
    .neq("sender_id", userId)
    .is("read_at", null);

  if (error) {
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0, error: null };
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
