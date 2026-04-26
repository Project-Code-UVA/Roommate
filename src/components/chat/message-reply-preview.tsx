/**
 * MessageReplyPreview — compact inline quote block rendered above message text.
 *
 * Handles all edge cases:
 * - Shows sender name ("You" vs display name)
 * - Replaces line breaks with spaces so multi-line originals collapse to one line
 * - Falls back to "Photo" / "Video" when the original has no text body
 * - Falls back to "Original message unavailable" for deleted/missing originals
 */

import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReplyPreviewData = {
  /** null = message was deleted / unavailable */
  readonly body: string | null;
  /** null = media-only message */
  readonly media_url?: string | null;
  /** Display name of the original sender, or null if unknown */
  readonly senderName: string | null;
  /** Whether the original sender is the current user */
  readonly isOwnMessage: boolean;
};

type Props = {
  readonly data: ReplyPreviewData;
  /** Called when the user taps the quote — e.g. to scroll to origin */
  readonly onPress: () => void;
  /**
   * Whether this preview is inside a sender bubble (purple) or receiver bubble
   * (gray). Adjusts accent and background colors accordingly.
   */
  readonly isSenderBubble: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the display text for the quoted preview body. */
function buildPreviewText(data: ReplyPreviewData): string {
  if (data.body === null && data.senderName === null) {
    // The original message was deleted or is no longer available
    return "Original message unavailable";
  }
  if (data.body) {
    // Collapse any line breaks to a single space for a compact preview
    return data.body.replace(/\n+/g, " ");
  }
  if (data.media_url) {
    return "Photo";
  }
  return "Original message unavailable";
}

/** Build the "Replying to …" label. */
function buildSenderLabel(data: ReplyPreviewData): string {
  if (data.isOwnMessage) return "Replying to you";
  if (data.senderName) return `Replying to ${data.senderName}`;
  return "Reply";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageReplyPreview({ data, onPress, isSenderBubble }: Props): React.JSX.Element | null {
  // Guard against partially-loaded or missing data
  if (!data) return null;

  const previewText = buildPreviewText(data);
  const senderLabel = buildSenderLabel(data);
  const isUnavailable = data.body === null && data.senderName === null;

  // Inside a purple sender bubble: use white-tinted colors
  // Inside a gray receiver bubble: use dark colors
  const containerBg = isSenderBubble ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)";
  const accentColor = isSenderBubble ? "rgba(255,255,255,0.7)" : "#7c3aed";
  const labelColor = isSenderBubble ? "rgba(255,255,255,0.75)" : "#7c3aed";
  const bodyColor = isSenderBubble ? "rgba(255,255,255,0.9)" : "#374151";
  const unavailableColor = isSenderBubble ? "rgba(255,255,255,0.5)" : "#9ca3af";

  return (
    <Pressable onPress={onPress} style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.content}>
        {/* "Replying to [Name]" label */}
        <Text
          style={[styles.senderLabel, { color: labelColor }]}
          numberOfLines={1}
        >
          {senderLabel}
        </Text>

        {/* Quote body or unavailable notice */}
        <Text
          style={[
            styles.body,
            { color: isUnavailable ? unavailableColor : bodyColor },
            isUnavailable && styles.bodyItalic,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {previewText}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 8,
    marginBottom: 6,
    overflow: "hidden",
    minHeight: 36,
  },
  accentBar: {
    width: 3,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: "center",
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  bodyItalic: {
    fontStyle: "italic",
  },
});
