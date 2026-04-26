/**
 * MessageReactions — floating reaction pills rendered below a message bubble.
 *
 * Features:
 * - Groups reactions by emoji and shows a count
 * - Highlights pills where the current user has reacted (purple tint)
 * - Tap to toggle: if already reacted → passes existing reactionId so caller
 *   can remove it; if not → passes null so caller can add it
 * - Positioned via the parent layout (outside the Pressable bubble)
 */

import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MessageReaction } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  readonly reactions: readonly MessageReaction[];
  readonly currentUserId: string;
  /**
   * Called when a reaction pill is tapped.
   * @param emoji - The emoji character of the tapped reaction
   * @param existingReactionId - The current user's existing reaction ID for
   *   this emoji, or null if they haven't reacted yet
   */
  readonly onToggle: (emoji: string, existingReactionId: string | null) => void;
  /** Align pills to the right (sender side) or left (receiver side) */
  readonly isSender: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type GroupedReaction = {
  readonly emoji: string;
  readonly count: number;
  /** The current user's reactionId for this emoji, or null */
  readonly myReactionId: string | null;
};

function groupReactions(
  reactions: readonly MessageReaction[],
  currentUserId: string,
): readonly GroupedReaction[] {
  if (reactions.length === 0) return [];

  // To meet the requirement of only showing ONE reaction pill at a time:
  // 1. Show the current user's reaction if they have one (highest priority).
  // 2. Otherwise, show the most recent reaction from any user.
  const myReaction = reactions.find((r) => r.user_id === currentUserId);
  const primary = myReaction || reactions[reactions.length - 1];

  // For the chosen emoji, count how many total people reacted with it.
  const count = reactions.filter((r) => r.emoji === primary.emoji).length;

  return [
    {
      emoji: primary.emoji,
      count,
      myReactionId: myReaction ? myReaction.id : null,
    },
  ];
}


// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MessageReactions({
  reactions,
  currentUserId,
  onToggle,
  isSender,
}: Props): React.JSX.Element | null {
  if (reactions.length === 0) return null;

  const grouped = groupReactions(reactions, currentUserId);

  return (
    <View style={[styles.container, isSender ? styles.alignRight : styles.alignLeft]}>
      {grouped.map((g) => {
        const isMyReaction = g.myReactionId !== null;

        return (
          <Pressable
            key={g.emoji}
            style={({ pressed }) => [
              styles.pill,
              isMyReaction && styles.pillActive,
              pressed && styles.pillPressed,
            ]}
            onPress={() => onToggle(g.emoji, g.myReactionId)}
            accessibilityLabel={`${g.emoji} ${g.count} reaction${g.count !== 1 ? "s" : ""}. ${isMyReaction ? "Tap to remove." : "Tap to add."}`}
          >
            <Text style={styles.emoji}>{g.emoji}</Text>
            {g.count > 1 && (
              <Text style={[styles.count, isMyReaction && styles.countActive]}>
                {g.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 3,
    paddingHorizontal: 2,
  },
  alignRight: {
    justifyContent: "flex-end",
  },
  alignLeft: {
    justifyContent: "flex-start",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillActive: {
    backgroundColor: "#ede9fe", // violet-100
    borderColor: "#7c3aed",    // violet-600
  },
  pillPressed: {
    opacity: 0.75,
  },
  emoji: {
    fontSize: 13,
    lineHeight: 18,
  },
  count: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  countActive: {
    color: "#7c3aed",
  },
});
