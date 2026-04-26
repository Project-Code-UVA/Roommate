/**
 * TypeScript types for the Chat/Messaging domain.
 *
 * Defines contracts for messages, threads, reactions, GIFs, icebreaker prompts,
 * and related data structures used across services, hooks, and components.
 *
 * All types are readonly/immutable per project coding conventions.
 */

// ---------------------------------------------------------------------------
// Delivery & Status
// ---------------------------------------------------------------------------

/** Local-only delivery status for optimistic UI */
export type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export type Message = {
  readonly id: string;
  readonly thread_id: string;
  readonly sender_id: string;
  readonly body: string | null;
  readonly media_url: string | null;
  readonly reply_to_id: string | null;
  readonly unsent_at: string | null;
  readonly deleted_for_everyone_at: string | null;
  readonly deleted_at: string | null;
  readonly delivered_at: string | null;
  readonly read_at: string | null;
  readonly edited_at: string | null;
  readonly created_at: string;
  /** Local-only field for optimistic UI state */
  readonly _status: DeliveryStatus | "failed";
  /** Joined reply-to message for inline quote preview */
  readonly reply_to: Message | null;
};

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

export type MessageReaction = {
  readonly id: string;
  readonly message_id: string;
  readonly user_id: string;
  readonly emoji: string;
  readonly created_at: string;
};

/**
 * Canonical tapback reaction types.
 * Stored in the DB as the emoji character; this enum maps friendly names to them.
 */
export type ReactionType =
  | "heart"
  | "thumbs_up"
  | "thumbs_down"
  | "laugh"
  | "emphasis"
  | "question";

/**
 * Maps each ReactionType to its display emoji.
 * Single source of truth — import this wherever reactions are rendered.
 */
export const REACTION_EMOJIS: Record<ReactionType, string> = {
  heart: "❤️",
  thumbs_up: "👍",
  thumbs_down: "👎",
  laugh: "😂",
  emphasis: "‼️",
  question: "?",
} as const;

/**
 * Ordered list of reaction types for consistent UI rendering.
 */
export const REACTION_TYPES: readonly ReactionType[] = [
  "heart",
  "thumbs_up",
  "thumbs_down",
  "laugh",
  "emphasis",
  "question",
] as const;

export const REACTION_OPTIONS: readonly {
  readonly type: ReactionType;
  readonly label: string;
  readonly symbol: string;
}[] = [
  { type: "heart", label: "Heart", symbol: "❤️" },
  { type: "thumbs_up", label: "Thumbs Up", symbol: "👍" },
  { type: "thumbs_down", label: "Thumbs Down", symbol: "👎" },
  { type: "laugh", label: "Laugh", symbol: "😂" },
  { type: "emphasis", label: "Emphasis", symbol: "‼️" },
  { type: "question", label: "Question", symbol: "?" },
] as const;

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------

export type ThreadStatus = "active" | "unmatched" | "blocked";

export type ThreadUser = {
  readonly id: string;
  readonly display_name: string;
  readonly avatar_url: string | null;
};

export type Thread = {
  readonly id: string;
  readonly match_id: string | null;
  readonly user_a_id: string;
  readonly user_b_id: string;
  readonly status: ThreadStatus;
  readonly created_at: string;
  /** Joined data for the other participant */
  readonly other_user: ThreadUser | null;
};

export type ThreadPreview = Thread & {
  readonly last_message: Message | null;
  readonly unread_count: number;
};

// ---------------------------------------------------------------------------
// GIFs
// ---------------------------------------------------------------------------

export type GifResult = {
  readonly id: string;
  /** Full-size GIF URL */
  readonly url: string;
  /** Small preview URL for grid display */
  readonly previewUrl: string;
  readonly width: number;
  readonly height: number;
};

// ---------------------------------------------------------------------------
// Icebreaker Prompts
// ---------------------------------------------------------------------------

export type IcebreakerCategory = "roommate" | "social";

export type IcebreakerPrompt = {
  readonly id: string;
  readonly text: string;
  readonly category: IcebreakerCategory;
};

// ---------------------------------------------------------------------------
// Send Message Params
// ---------------------------------------------------------------------------

export type SendMessageParams = {
  readonly thread_id: string;
  readonly body: string | null;
  readonly media_url: string | null;
  readonly reply_to_id: string | null;
  /** Client-generated UUID for optimistic pattern */
  readonly message_id: string;
};

// ---------------------------------------------------------------------------
// Reporting
// ---------------------------------------------------------------------------

export type ReportCategory =
  | "harassment"
  | "sexual_content"
  | "hate_speech"
  | "spam"
  | "impersonation"
  | "underage"
  | "safety_threat"
  | "other";
