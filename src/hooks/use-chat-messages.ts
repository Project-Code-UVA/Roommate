/**
 * useChatMessages hook: Manages chat message state with Realtime subscriptions.
 *
 * Fetches initial messages, subscribes to Supabase Realtime for live
 * INSERT/UPDATE/DELETE events on messages AND message_reactions.
 * Handles pagination, delivery marking, and local message hiding.
 *
 * Returns a live `reactionsMap` so components have a single source of truth
 * for which reactions are attached to which messages.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";
import { markThreadDelivered, markThreadRead } from "@/services/thread-service";
import type { Message, MessageReaction } from "@/types/chat";

const HIDDEN_MESSAGES_KEY = "room:hidden_messages";

const PAGE_SIZE = 25;

type UseChatMessagesReturn = {
  readonly messages: readonly Message[];
  readonly isLoading: boolean;
  readonly hasMore: boolean;
  readonly loadMore: () => void;
  readonly hideMessageLocally: (messageId: string) => void;
  /** Live map of messageId → reactions for that message */
  readonly reactionsMap: Map<string, readonly MessageReaction[]>;
};

export function useChatMessages(
  threadId: string,
  userId: string,
): UseChatMessagesReturn {
  const [messages, setMessages] = useState<readonly Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  // reactionsMap: messageId → array of reactions
  const [reactionsMap, setReactionsMap] = useState<Map<string, readonly MessageReaction[]>>(new Map());
  const loadingMore = useRef(false);
  const messagesRef = useRef<readonly Message[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // -------------------------------------------------------------------------
  // Fetch hidden messages on mount
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function loadHidden() {
      try {
        const raw = await AsyncStorage.getItem(HIDDEN_MESSAGES_KEY);
        if (raw) {
          setHiddenMessageIds(new Set(JSON.parse(raw)));
        }
      } catch (err) {
        // ignore
      }
    }
    loadHidden();
  }, []);

  // -------------------------------------------------------------------------
  // Fetch initial page of messages
  // -------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchInitial() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("messages")
        // Join the sender's display_name on the replied-to message so we can
        // show "Replying to [Name]" in the quoted preview without extra fetches.
        .select("*, reply_to:reply_to_id(id,body,sender_id,media_url)")

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
        // Opening the thread = marking incoming messages read.
        markThreadRead(threadId, userId);
      }

      setIsLoading(false);
    }

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  // -------------------------------------------------------------------------
  // Fetch initial reactions for the current thread's messages
  // -------------------------------------------------------------------------

  useEffect(() => {
    async function fetchReactions() {
      // Get all message IDs in the thread first, then batch-fetch reactions.
      // We use a join on messages so we only fetch reactions for this thread.
      const { data, error } = await supabase
        .from("message_reactions")
        .select("*, message:messages!message_id(thread_id)")
        .eq("message.thread_id", threadId);

      if (error || !data) return;

      // Build the map from the fetched reactions
      const map = new Map<string, MessageReaction[]>();
      for (const reaction of data as unknown as MessageReaction[]) {
        const existing = map.get(reaction.message_id) ?? [];
        map.set(reaction.message_id, [...existing, reaction]);
      }
      setReactionsMap(map);
    }

    fetchReactions();
  }, [threadId]);

  // -------------------------------------------------------------------------
  // Realtime subscription: messages + reactions
  // -------------------------------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${threadId}`)
      // ── Message INSERT ───────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as Message;
          let hydratedReply: Message | null = null;

          if (newMsg.reply_to_id) {
            const localReply = messagesRef.current.find(
              (message) => message.id === newMsg.reply_to_id,
            );

            if (localReply) {
              hydratedReply = localReply;
            } else {
              const { data: fetchedReply, error: replyError } = await supabase
                .from("messages")
                .select("id,body,sender_id,media_url")
                .eq("id", newMsg.reply_to_id)
                .maybeSingle();

              if (!replyError && fetchedReply) {
                hydratedReply = fetchedReply as unknown as Message;
              }
            }
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [
              { ...newMsg, _status: "sent" as const, reply_to: hydratedReply },
              ...prev,
            ];
          });

          markThreadDelivered(threadId, userId);
          // User is actively in the thread — mark incoming messages read too.
          if (newMsg.sender_id !== userId) {
            markThreadRead(threadId, userId);
          }
        },
      )
      // ── Message UPDATE (edits, delivery, read receipts) ──────────────────
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
                body: updated.body,
                media_url: updated.media_url,
                edited_at: updated.edited_at,
                delivered_at: updated.delivered_at,
                read_at: updated.read_at,
                unsent_at: updated.unsent_at,
                deleted_for_everyone_at: updated.deleted_for_everyone_at,
                deleted_at: updated.deleted_at,
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
      // ── Message DELETE (unsend) ──────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload: { old: Record<string, unknown> }) => {
          const deletedId = payload.old.id as string;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        },
      )
      // ── Reaction INSERT ──────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reactions",
        },
        (payload: { new: Record<string, unknown> }) => {
          const newReaction = payload.new as unknown as MessageReaction;
          setReactionsMap((prev) => {
            const next = new Map(prev);
            const existing = next.get(newReaction.message_id) ?? [];
            // Guard against duplicates from our own optimistic updates
            if (existing.some((r) => r.id === newReaction.id)) return prev;
            next.set(newReaction.message_id, [...existing, newReaction]);
            return next;
          });
        },
      )
      // ── Reaction DELETE ──────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "message_reactions",
        },
        (payload: { new: Record<string, unknown>; old: Record<string, unknown> }) => {
          const updatedReaction = payload.new as unknown as MessageReaction;
          const newMessageId = updatedReaction.message_id;

          setReactionsMap((prev) => {
            const next = new Map(prev);

            // 1. Remove from old location
            let oldMessageId = (payload.old?.message_id as string) || newMessageId;

            // If message_id is missing in 'old', we might need to find where it was.
            // But usually for reactions, the message_id doesn't change.
            // Still, let's be safe and remove this reaction ID from ANY list it was in.
            for (const [mId, reactions] of prev.entries()) {
              if (reactions.some(r => r.id === updatedReaction.id)) {
                const filtered = reactions.filter(r => r.id !== updatedReaction.id);
                if (filtered.length === 0) {
                  next.delete(mId);
                } else {
                  next.set(mId, filtered);
                }
                break;
              }
            }

            // 2. Add to new location
            const targetList = [...(next.get(newMessageId) ?? [])].filter(
              (reaction) => reaction.id !== updatedReaction.id,
            );
            next.set(newMessageId, [...targetList, updatedReaction]);
            return next;
          });
        },

      )
      // ── Reaction DELETE ──────────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "message_reactions",
        },
        (payload: { old: Record<string, unknown> }) => {
          const deletedId = payload.old.id as string;

          setReactionsMap((prev) => {
            const next = new Map(prev);
            let targetMessageId: string | null = null;

            // If message_id is missing (common in DELETE payloads), search for it.
            if (payload.old.message_id) {
              targetMessageId = payload.old.message_id as string;
            } else {
              for (const [mId, reactions] of prev.entries()) {
                if (reactions.some(r => r.id === deletedId)) {
                  targetMessageId = mId;
                  break;
                }
              }
            }

            if (!targetMessageId) return prev;

            const existing = next.get(targetMessageId) ?? [];
            const filtered = existing.filter((r) => r.id !== deletedId);

            if (filtered.length === 0) {
              next.delete(targetMessageId);
            } else {
              next.set(targetMessageId, filtered);
            }
            return next;
          });
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
      .select("*, reply_to:messages!reply_to_id(id,body,sender_id,media_url)")
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

  // -------------------------------------------------------------------------
  // Local Hide Action
  // -------------------------------------------------------------------------

  const hideMessageLocally = useCallback((messageId: string) => {
    setHiddenMessageIds((prev) => {
      const next = new Set(prev);
      next.add(messageId);
      return next;
    });
  }, []);

  const visibleMessages = messages.filter((m) => !hiddenMessageIds.has(m.id));

  return { messages: visibleMessages, isLoading, hasMore, loadMore, hideMessageLocally, reactionsMap };
}
