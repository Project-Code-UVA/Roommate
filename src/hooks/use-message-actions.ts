/**
 * useMessageActions hook: Provides action functions for chat interactions.
 *
 * Exposes sendText, sendMedia, sendReaction, removeReaction,
 * sendReply, copyText, and deleteForMe.
 */

import { useCallback } from "react";
import * as Clipboard from "expo-clipboard";

import {
  sendMessage,
  addReaction,
  removeReaction as removeReactionService,
  deleteMessageForMe,
} from "@/services/message-service";
import type { SendMessageParams } from "@/types/chat";

// ---------------------------------------------------------------------------
// UUID generation (works in React Native)
// ---------------------------------------------------------------------------

function generateId(): string {
  // crypto.randomUUID not available in all RN environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type UseMessageActionsReturn = {
  readonly sendText: (body: string, replyToId?: string) => Promise<void>;
  readonly sendMedia: (
    mediaUrl: string,
    caption?: string,
    replyToId?: string,
  ) => Promise<void>;
  readonly sendReaction: (messageId: string, emoji: string) => Promise<void>;
  readonly removeReaction: (reactionId: string) => Promise<void>;
  readonly sendReply: (body: string, replyToId: string) => Promise<void>;
  readonly copyText: (text: string) => Promise<void>;
  readonly deleteForMe: (messageId: string) => Promise<void>;
};

export function useMessageActions(
  threadId: string,
  userId: string,
): UseMessageActionsReturn {
  const sendText = useCallback(
    async (body: string, replyToId?: string) => {
      const params: SendMessageParams = {
        thread_id: threadId,
        body,
        media_url: null,
        reply_to_id: replyToId ?? null,
        message_id: generateId(),
      };

      await sendMessage(params, userId);
    },
    [threadId, userId],
  );

  const sendMedia = useCallback(
    async (mediaUrl: string, caption?: string, replyToId?: string) => {
      const params: SendMessageParams = {
        thread_id: threadId,
        body: caption ?? null,
        media_url: mediaUrl,
        reply_to_id: replyToId ?? null,
        message_id: generateId(),
      };

      await sendMessage(params, userId);
    },
    [threadId, userId],
  );

  const sendReactionFn = useCallback(
    async (messageId: string, emoji: string) => {
      await addReaction(messageId, userId, emoji);
    },
    [userId],
  );

  const removeReactionFn = useCallback(async (reactionId: string) => {
    await removeReactionService(reactionId);
  }, []);

  const sendReply = useCallback(
    async (body: string, replyToId: string) => {
      await sendText(body, replyToId);
    },
    [sendText],
  );

  const copyTextFn = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
  }, []);

  const deleteForMeFn = useCallback(
    async (messageId: string) => {
      await deleteMessageForMe(messageId, userId);
    },
    [userId],
  );

  return {
    sendText,
    sendMedia,
    sendReaction: sendReactionFn,
    removeReaction: removeReactionFn,
    sendReply,
    copyText: copyTextFn,
    deleteForMe: deleteForMeFn,
  };
}
