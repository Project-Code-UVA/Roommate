/**
 * Empty state view for the discovery stack.
 *
 * Shown when no more profiles are available to swipe.
 * Displays a friendly icon, heading, and encouraging message.
 */

import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Ionicons
        name="people-outline"
        size={80}
        color={COLORS.primary[300]}
      />
      <Text className="mt-6 text-center text-2xl font-bold text-white">
        You've seen everyone!
      </Text>
      <Text className="mt-3 text-center text-base text-gray-400">
        Check back later for new roommates at your school.
      </Text>
    </View>
  );
}
