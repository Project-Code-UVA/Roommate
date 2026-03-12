/**
 * useChatMessages hook: Manages chat message state with Realtime subscriptions.
 *
 * Fetches initial messages, subscribes to Supabase Realtime for live
 * INSERT/UPDATE events, handles pagination, and marks delivery.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/lib/supabase";
import { markThreadDelivered } from "@/services/thread-service";
import type { Message } from "@/types/chat";

const PAGE_SIZE = 25;

type UseChatMessagesReturn = {
  readonly messages: readonly Message[];
  readonly isLoading: boolean;
  readonly hasMore: boolean;
  readonly loadMore: () => void;
};

export function useChatMessages(
  threadId: string,
  userId: string,
): UseChatMessagesReturn {
  const [messages, setMessages] = useState<readonly Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);

  // -------------------------------------------------------------------------
  // Fetch initial page
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchInitial() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select("*, reply_to:messages!reply_to_id(id,body,sender_id)")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (cancelled) return;

      if (!error && data) {
        const mapped = (data as unknown as readonly Message[]).map((m) => ({
          ...m,
          _status: m.read_at
            ? ("read" as const)
            : m.delivered_at
              ? ("delivered" as const)
              : ("sent" as const),
        }));
        setMessages(mapped);
        setHasMore(data.length >= PAGE_SIZE);
      }

      setIsLoading(false);
    }

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  // -------------------------------------------------------------------------
  // Realtime subscription
  // -------------------------------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as Message;

          // Skip self-sent messages (already shown via optimistic update)
          if (newMsg.sender_id === userId) return;

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [{ ...newMsg, _status: "sent" as const, reply_to: null }, ...prev];
          });

          // Mark as delivered
          markThreadDelivered(threadId, userId);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as unknown as Message;

          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== updated.id) return m;
              return {
                ...m,
                delivered_at: updated.delivered_at ?? m.delivered_at,
                read_at: updated.read_at ?? m.read_at,
                _status: updated.read_at
                  ? ("read" as const)
                  : updated.delivered_at
                    ? ("delivered" as const)
                    : m._status,
              };
            }),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, userId]);

  // -------------------------------------------------------------------------
  // Load more (older messages)
  // -------------------------------------------------------------------------

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore || messages.length === 0) return;

    loadingMore.current = true;
    const oldest = messages[messages.length - 1];

    const { data, error } = await supabase
      .from("messages")
      .select("*, reply_to:messages!reply_to_id(id,body,sender_id)")
      .eq("thread_id", threadId)
      .lt("created_at", oldest.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (!error && data) {
      const mapped = (data as unknown as readonly Message[]).map((m) => ({
        ...m,
        _status: m.read_at
          ? ("read" as const)
          : m.delivered_at
            ? ("delivered" as const)
            : ("sent" as const),
      }));
      setMessages((prev) => [...prev, ...mapped]);
      setHasMore(data.length >= PAGE_SIZE);
    }

    loadingMore.current = false;
  }, [hasMore, messages, threadId]);

  return { messages, isLoading, hasMore, loadMore };
}
