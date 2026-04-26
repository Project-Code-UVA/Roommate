/**
 * ReactionPicker — tapback-style row of 6 reaction buttons.
 *
 * Spring-animates in on mount. Each button maps to a ReactionType and
 * displays its canonical emoji. Calls onSelect with the emoji string so it
 * can be stored directly in the DB without any mapping layer.
 *
 * The "already reacted" state is shown by highlighting the matching button.
 */

import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { REACTION_OPTIONS } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  /** The emoji currently selected by this user on this message. */
  readonly activeEmoji: string | null;
  /** Called with the emoji character (e.g. "❤️") when the user taps a reaction. */
  readonly onSelect: (emoji: string) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReactionPicker({ activeEmoji, onSelect }: Props) {
  // Spring in from scale 0 → 1 on mount
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 12,
    }).start();
  }, [scale]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale }] }]}>
      {REACTION_OPTIONS.map((option) => {
        const emoji = option.symbol;
        const isActive = activeEmoji === emoji;

        return (
          <Pressable
            key={option.type}
            style={({ pressed }) => [
              styles.button,
              isActive && styles.buttonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => onSelect(emoji)}
            accessibilityLabel={option.label}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: {
    backgroundColor: "#ede9fe", // violet-100
    borderWidth: 1.5,
    borderColor: "#7c3aed", // violet-600
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.9 }],
  },
  emoji: {
    fontSize: 22,
  },
});
