/**
 * Message service: Send messages, reactions, delivery updates.
 *
 * Wraps Supabase RPC and table operations for the messaging domain.
 * All functions return structured error objects (never throw).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { supabase } from "@/lib/supabase";
import type { MessageReaction, SendMessageParams } from "@/types/chat";

// Cast for RPC functions not yet in generated database types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = supabase.rpc.bind(supabase) as any;

const HIDDEN_MESSAGES_KEY = "room:hidden_messages";

// ---------------------------------------------------------------------------
// Send message via RPC
// ---------------------------------------------------------------------------

type SendResult = {
  readonly data: { readonly message_id: string } | null;
  readonly error: string | null;
};

export async function sendMessage(
  params: SendMessageParams,
  senderId: string,
): Promise<SendResult> {
  const { data, error } = await rpc("send_message", {
    p_thread_id: params.thread_id,
    p_sender_id: senderId,
    p_body: params.body,
    p_media_url: params.media_url,
    p_reply_to_id: params.reply_to_id,
    p_message_id: params.message_id,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const result = data as Record<string, unknown>;

  if (result.error) {
    return { data: null, error: result.error as string };
  }

  return {
    data: { message_id: result.message_id as string },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

type ReactionResult = {
  readonly data: MessageReaction | null;
  readonly error: string | null;
};

export async function addReaction(
  messageId: string,
  userId: string,
  emoji: string,
): Promise<ReactionResult> {
  const { data, error } = await supabase
    .from("message_reactions")
    .insert({
      message_id: messageId,
      user_id: userId,
      emoji,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as MessageReaction, error: null };
}

type SimpleResult = {
  readonly error: string | null;
};

export async function removeReaction(reactionId: string): Promise<SimpleResult> {
  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("id", reactionId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// ---------------------------------------------------------------------------
// Delivery status
// ---------------------------------------------------------------------------

export async function updateDeliveryStatus(
  messageId: string,
): Promise<SimpleResult> {
  const { error } = await supabase
    .from("messages")
    .update({ delivered_at: new Date().toISOString() })
    .eq("id", messageId)
    .is("delivered_at", null);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// ---------------------------------------------------------------------------
// Delete message for me (local blacklist, no schema change)
// ---------------------------------------------------------------------------

type DeleteResult = {
  readonly success: boolean;
  readonly error: string | null;
};

export async function deleteMessageForMe(
  messageId: string,
  _userId: string,
): Promise<DeleteResult> {
  try {
    const raw = await AsyncStorage.getItem(HIDDEN_MESSAGES_KEY);
    const hidden: readonly string[] = raw ? JSON.parse(raw) : [];
    const updated = [...hidden, messageId];
    await AsyncStorage.setItem(HIDDEN_MESSAGES_KEY, JSON.stringify(updated));
    return { success: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to hide message";
    return { success: false, error: message };
  }
}
