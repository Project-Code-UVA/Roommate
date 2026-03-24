/**
 * Edge Function: Send push notifications via Expo Push API.
 *
 * Triggered by database webhooks on match/message inserts.
 * Looks up recipient's push tokens and sends via Expo's push service.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type PushPayload = {
  type: "match" | "message";
  // Match fields
  user_a_id?: string;
  user_b_id?: string;
  match_id?: string;
  // Message fields
  recipient_id?: string;
  sender_id?: string;
  thread_id?: string;
  message_preview?: string;
};

Deno.serve(async (req) => {
  try {
    const payload: PushPayload = await req.json();

    if (payload.type === "match") {
      await sendMatchNotifications(payload);
    } else if (payload.type === "message") {
      await sendMessageNotification(payload);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

async function sendMatchNotifications(payload: PushPayload) {
  const userIds = [payload.user_a_id, payload.user_b_id].filter(Boolean);

  for (const userId of userIds) {
    const tokens = await getTokensForUser(userId!);
    if (tokens.length === 0) continue;

    // Get the other user's name
    const otherId = userId === payload.user_a_id ? payload.user_b_id : payload.user_a_id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", otherId)
      .single();

    const name = profile?.display_name ?? "Someone";

    await sendExpoPush(tokens, {
      title: "New Match! 🎉",
      body: `You matched with ${name}!`,
      data: { type: "match", matchId: payload.match_id },
    });
  }
}

async function sendMessageNotification(payload: PushPayload) {
  if (!payload.recipient_id) return;

  const tokens = await getTokensForUser(payload.recipient_id);
  if (tokens.length === 0) return;

  // Get sender name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", payload.sender_id)
    .single();

  const senderName = profile?.display_name ?? "Someone";
  const preview = payload.message_preview ?? "Sent a message";

  // Get sender avatar for notification data
  const { data: photo } = await supabase
    .from("photos")
    .select("url")
    .eq("user_id", payload.sender_id)
    .order("order_index")
    .limit(1)
    .single();

  await sendExpoPush(tokens, {
    title: senderName,
    body: preview,
    data: {
      type: "message",
      threadId: payload.thread_id,
      otherUserId: payload.sender_id,
      otherName: senderName,
      otherAvatar: photo?.url ?? "",
    },
  });
}

async function getTokensForUser(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("push_tokens")
    .select("expo_push_token")
    .eq("user_id", userId);

  return (data ?? []).map((row) => row.expo_push_token);
}

async function sendExpoPush(
  tokens: string[],
  notification: { title: string; body: string; data: Record<string, unknown> },
) {
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title: notification.title,
    body: notification.body,
    data: notification.data,
  }));

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Expo push API error:", text);
  }
}
