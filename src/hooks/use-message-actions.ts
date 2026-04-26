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
  removeReactionForMessageUser,
  deleteMessageForMe,
  editMessage as editMessageService,
  unsendMessage as unsendMessageService,
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

type SendError = { readonly error: string | null };

type UseMessageActionsReturn = {
  readonly sendText: (body: string, replyToId?: string) => Promise<SendError>;
  readonly sendMedia: (
    mediaUrl: string,
    caption?: string,
    replyToId?: string,
  ) => Promise<SendError>;
  readonly sendReaction: (messageId: string, emoji: string) => Promise<SendError>;
  readonly removeReaction: (messageId: string) => Promise<SendError>;
  readonly sendReply: (body: string, replyToId: string) => Promise<SendError>;
  readonly copyText: (text: string) => Promise<void>;
  readonly deleteForMe: (messageId: string) => Promise<void>;
  readonly editMessage: (messageId: string, newBody: string) => Promise<SendError>;
  readonly unsendMessage: (messageId: string) => Promise<SendError>;
};

export function useMessageActions(
  threadId: string,
  userId: string,
): UseMessageActionsReturn {
  const sendText = useCallback(
    async (body: string, replyToId?: string): Promise<SendError> => {
      const params: SendMessageParams = {
        thread_id: threadId,
        body,
        media_url: null,
        reply_to_id: replyToId ?? null,
        message_id: generateId(),
      };

      const result = await sendMessage(params, userId);
      return { error: result.error };
    },
    [threadId, userId],
  );

  const sendMedia = useCallback(
    async (mediaUrl: string, caption?: string, replyToId?: string): Promise<SendError> => {
      const params: SendMessageParams = {
        thread_id: threadId,
        body: caption ?? null,
        media_url: mediaUrl,
        reply_to_id: replyToId ?? null,
        message_id: generateId(),
      };

      const result = await sendMessage(params, userId);
      return { error: result.error };
    },
    [threadId, userId],
  );

  const sendReactionFn = useCallback(
    async (messageId: string, emoji: string) => {
      const result = await addReaction(messageId, userId, emoji);
      return { error: result.error };
    },
    [userId],
  );

  const removeReactionFn = useCallback(
    async (messageId: string) => {
      const result = await removeReactionForMessageUser(messageId, userId);
      return { error: result.error };
    },
    [userId],
  );

  const sendReply = useCallback(
    async (body: string, replyToId: string): Promise<SendError> => {
      return sendText(body, replyToId);
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

  const editMessageFn = useCallback(
    async (messageId: string, newBody: string): Promise<SendError> => {
      const result = await editMessageService(messageId, newBody);
      return { error: result.error };
    },
    [],
  );

  const unsendMessageFn = useCallback(
    async (messageId: string): Promise<SendError> => {
      const result = await unsendMessageService(messageId);
      return { error: result.error };
    },
    [],
  );

  return {
    sendText,
    sendMedia,
    sendReaction: sendReactionFn,
    removeReaction: removeReactionFn,
    sendReply,
    copyText: copyTextFn,
    deleteForMe: deleteForMeFn,
    editMessage: editMessageFn,
    unsendMessage: unsendMessageFn,
  };
}
