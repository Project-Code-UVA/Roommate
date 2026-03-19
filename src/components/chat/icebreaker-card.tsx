/**
 * IcebreakerCard -- floating card displaying 3 random conversation prompts.
 *
 * Features:
 * - Shows 3 prompts from the icebreaker pool
 * - "More" button to rotate to next set
 * - Dismiss (X) button
 * - Tap a prompt to fill the composer
 */

import React, { useState, useCallback } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { getRandomPrompts } from "@/lib/icebreaker-prompts";
import { COLORS } from "@/lib/constants";
import type { IcebreakerPrompt } from "@/types/chat";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  readonly onSelectPrompt: (text: string) => void;
  readonly onDismiss: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IcebreakerCard({ onSelectPrompt, onDismiss }: Props): React.JSX.Element | null {
  const [prompts, setPrompts] = useState<readonly IcebreakerPrompt[]>(() =>
    getRandomPrompts(3),
  );
  const [dismissed, setDismissed] = useState(false);

  const handleMore = useCallback(() => {
    setPrompts(getRandomPrompts(3));
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss();
  }, [onDismiss]);

  if (dismissed) {
    return null;
  }

  return (
    <View className="mx-4 my-2 rounded-2xl bg-white p-4 shadow-lg">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-gray-900">Break the ice</Text>
        <Pressable testID="icebreaker-dismiss" onPress={handleDismiss}>
          <Ionicons name="close" size={20} color={COLORS.gray[400]} />
        </Pressable>
      </View>

      {/* Prompts */}
      {prompts.map((prompt) => (
        <Pressable
          key={prompt.id}
          onPress={() => onSelectPrompt(prompt.text)}
          className="bg-gray-50 rounded-xl p-3 mb-2"
        >
          <Text className="text-sm text-gray-800">{prompt.text}</Text>
        </Pressable>
      ))}

      {/* More button */}
      <Pressable testID="icebreaker-more" onPress={handleMore} className="items-center pt-1">
        <Text className="text-sm font-semibold text-violet-600">More</Text>
      </Pressable>
    </View>
  );
}
