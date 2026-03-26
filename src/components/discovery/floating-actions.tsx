/**
 * Floating action buttons — fixed at bottom of discovery screen.
 *
 * Three circular buttons: X (dismiss), chat (message), Heart (like).
 * Like button uses a purple-to-pink gradient (Figma design).
 * Triggers haptic feedback on press.
 */

import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
        style={({ pressed }) => [styles.dismissButton, pressed && styles.buttonPressed]}
        testID="action-dismiss"
        accessibilityRole="button"
        accessibilityLabel="Pass"
      >
        <Ionicons name="close" size={28} color="#ef4444" />
      </Pressable>

      {/* Info / profile detail */}
      <Pressable
        onPress={handleMessage}
        style={({ pressed }) => [styles.messageButton, pressed && styles.buttonPressed]}
        testID="action-message"
        accessibilityRole="button"
        accessibilityLabel="Info"
      >
        <Ionicons name="information-circle-outline" size={26} color="#3b82f6" />
      </Pressable>

      {/* Like — purple-to-pink gradient */}
      <Pressable
        onPress={handleLike}
        style={({ pressed }) => [styles.likePressable, pressed && styles.buttonPressed]}
        testID="action-like"
        accessibilityRole="button"
        accessibilityLabel="Like"
      >
        <LinearGradient
          colors={["#a855f7", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.likeGradient}
        >
          <Ionicons name="heart" size={26} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 28,
    paddingVertical: 14,
  },
  dismissButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  likePressable: {
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    borderRadius: 32,
  },
  likeGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
});
