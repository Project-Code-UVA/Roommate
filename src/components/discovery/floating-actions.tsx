/**
 * Floating action buttons — fixed at bottom of discovery screen.
 *
 * Two circular buttons: X (dismiss) and Heart (like).
 * Triggers haptic feedback on press.
 */

import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FloatingActionsProps = {
  readonly onDismiss: () => void;
  readonly onMessage: () => void;
  readonly onLike: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FloatingActions({ onDismiss, onMessage, onLike }: FloatingActionsProps) {
  const handleDismiss = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDismiss();
  }, [onDismiss]);

  const handleMessage = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMessage();
  }, [onMessage]);

  const handleLike = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLike();
  }, [onLike]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Dismiss */}
      <Pressable
        onPress={handleDismiss}
        style={({ pressed }) => [
          styles.button,
          styles.dismissButton,
          pressed && styles.buttonPressed,
        ]}
        testID="action-dismiss"
        accessibilityRole="button"
        accessibilityLabel="Pass"
      >
        <Ionicons name="close" size={28} color="#ef4444" />
      </Pressable>

      {/* Message */}
      <Pressable
        onPress={handleMessage}
        style={({ pressed }) => [
          styles.button,
          styles.messageButton,
          pressed && styles.buttonPressed,
        ]}
        testID="action-message"
        accessibilityRole="button"
        accessibilityLabel="Message"
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#7c3aed" />
      </Pressable>

      {/* Like */}
      <Pressable
        onPress={handleLike}
        style={({ pressed }) => [
          styles.button,
          styles.likeButton,
          pressed && styles.buttonPressed,
        ]}
        testID="action-like"
        accessibilityRole="button"
        accessibilityLabel="Like"
      >
        <Ionicons name="heart" size={26} color="#4ade80" />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 32,
    zIndex: 50,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  dismissButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fecaca",
  },
  messageButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ddd6fe",
  },
  likeButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#bbf7d0",
  },
  buttonPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
});
