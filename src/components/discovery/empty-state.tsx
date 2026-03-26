/**
 * Empty state view for the discovery stack.
 *
 * Shown when no more profiles are available to swipe.
 * Styled for the purple-pink gradient background (Figma design).
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
      <View className="w-24 h-24 rounded-full bg-purple-100 items-center justify-center mb-6">
        <Ionicons name="sparkles" size={48} color={COLORS.primary[600]} />
      </View>
      <Text className="text-center text-2xl font-bold text-gray-900 mb-3">
        You're all caught up!
      </Text>
      <Text className="text-center text-base text-gray-500">
        Check back later for new roommates at your school.
      </Text>
    </View>
  );
}
