/**
 * Empty state view for the discovery stack.
 *
 * Shown when no more profiles are available to swipe.
 * Styled for the purple-pink gradient background (Figma design).
 */

import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EmptyStateProps {
  onRefresh?: () => void;
}

export function EmptyState({ onRefresh }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center mb-6">
        <Ionicons name="sparkles" size={48} color={COLORS.primary[600]} />
      </View>
      <Text className="text-center text-2xl font-bold text-gray-900 mb-3">
        You're all caught up!
      </Text>
      <Text className="text-center text-base text-gray-500">
        Check back later for new roommates at your school.
      </Text>
      {onRefresh && (
        <TouchableOpacity
          onPress={onRefresh}
          activeOpacity={0.85}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={20} color="#fff" style={styles.refreshIcon} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary[600],
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 24,
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
