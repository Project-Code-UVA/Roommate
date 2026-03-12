/**
 * MessageReactions -- renders grouped reaction pills below a message bubble.
 *
 * Groups reactions by emoji, displays count, and handles tap to toggle.
 */

import React from "react";
import { View, Text, Pressable } from "react-native";

import type { MessageReaction } from "@/types/chat";

type Props = {
  readonly reactions: readonly MessageReaction[];
  readonly onReactionPress: (emoji: string) => void;
};

type GroupedReaction = {
  readonly emoji: string;
  readonly count: number;
};

function groupReactions(reactions: readonly MessageReaction[]): readonly GroupedReaction[] {
  const counts = new Map<string, number>();
  for (const r of reactions) {
    counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count }));
}

export function MessageReactions({ reactions, onReactionPress }: Props): React.JSX.Element | null {
  if (reactions.length === 0) {
    return null;
  }

  const grouped = groupReactions(reactions);

  return (
    <View className="flex-row flex-wrap gap-1 mt-1">
      {grouped.map((g) => (
        <Pressable
          key={g.emoji}
          onPress={() => onReactionPress(g.emoji)}
          className="flex-row items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5"
        >
          <Text className="text-xs">{g.emoji}</Text>
          <Text className="text-xs text-gray-600">{g.count}</Text>
        </Pressable>
      ))}
    </View>
  );
}
