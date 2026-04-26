import type { Message } from "@/types/chat";

export function isDeletedForCurrentUserOnly(
  message: Message,
  currentUserId: string,
  hiddenMessageIds: ReadonlySet<string> = new Set(),
): boolean {
  void currentUserId;
  return hiddenMessageIds.has(message.id);
}

export function getLatestVisibleMessageForUser(
  messages: readonly Message[],
  currentUserId: string,
  hiddenMessageIds: ReadonlySet<string> = new Set(),
): Message | null {
  return (
    [...messages]
      .filter((message) => !isDeletedForCurrentUserOnly(message, currentUserId, hiddenMessageIds))
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0] ?? null
  );
}

export function getAttachmentPreviewLabel(message: Message): string {
  const mediaUrl = message.media_url;
  if (!mediaUrl) return "Attachment";

  const normalized = mediaUrl.toLowerCase();
  if (
    normalized.includes(".jpg") ||
    normalized.includes(".jpeg") ||
    normalized.includes(".png") ||
    normalized.includes(".webp") ||
    normalized.includes(".gif")
  ) {
    return "Photo";
  }

  if (
    normalized.includes(".mp4") ||
    normalized.includes(".mov") ||
    normalized.includes(".webm")
  ) {
    return "Video";
  }

  if (
    normalized.includes(".m4a") ||
    normalized.includes(".aac") ||
    normalized.includes(".mp3") ||
    normalized.includes(".wav")
  ) {
    return "Voice message";
  }

  const fileName = mediaUrl.split("/").pop();
  if (fileName && fileName.includes(".")) {
    return `File: ${fileName}`;
  }

  return "File";
}

type ConversationPreviewOptions = {
  readonly isGroupChat?: boolean;
  readonly senderName?: string | null;
  readonly currentUserLabel?: string;
};

export function getConversationPreview(
  message: Message | null,
  currentUserId: string,
  options: ConversationPreviewOptions = {},
): string {
  if (!message) return "No messages yet";

  const senderName = options.senderName || "Someone";
  const isCurrentUser = message.sender_id === currentUserId;
  const currentUserLabel = options.currentUserLabel ?? "You";

  if (message.unsent_at) {
    return "Message Unsent";
  }

  if (message.deleted_for_everyone_at || message.deleted_at) {
    return "Message Deleted";
  }


  const prefix = isCurrentUser
    ? `${currentUserLabel}: `
    : options.isGroupChat
      ? `${senderName}: `
      : "";

  const editedSuffix = message.edited_at ? " (edited)" : "";

  if (message.body && message.body.trim().length > 0) {
    return `${prefix}${message.body.trim()}${editedSuffix}`;
  }

  if (message.media_url) {
    return `${prefix}${getAttachmentPreviewLabel(message)}${editedSuffix}`;
  }

  return `${prefix}Message${editedSuffix}`;
}
