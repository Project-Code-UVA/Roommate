/**
 * Shared wrapper for onboarding step screens.
 *
 * Provides: back arrow, title, subtitle, keyboard avoidance, safe area insets.
 */

import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

type StepContainerProps = {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly showBack?: boolean;
  readonly children: ReactNode;
};

export function StepContainer({
  title,
  subtitle,
  onBack,
  showBack = true,
  children,
}: StepContainerProps) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-6">
          {showBack && onBack ? (
            <Pressable
              onPress={onBack}
              className="mb-4 mt-2 h-10 w-10 items-center justify-center rounded-full"
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
          ) : (
            <View className="mb-4 mt-2 h-10" />
          )}

          <Text className="mb-2 text-2xl font-bold text-gray-900">
            {title}
          </Text>

          {subtitle ? (
            <Text className="mb-6 text-base text-gray-500">{subtitle}</Text>
          ) : (
            <View className="mb-6" />
          )}

          <View className="flex-1">{children}</View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
