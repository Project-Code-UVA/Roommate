import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/constants";
import type { ReactNode } from "react";

interface StepContainerProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  /** Current step index (0-based) */
  currentStep?: number;
  /** Total number of steps */
  totalSteps?: number;
  children: ReactNode;
}

export function StepContainer({
  title,
  subtitle,
  onBack,
  showBack = true,
  currentStep = 0,
  totalSteps = 4,
  children,
}: StepContainerProps) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top bar: back button + progress */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center mb-4">
          {showBack && onBack ? (
            <TouchableOpacity onPress={onBack} className="mr-3">
              <Ionicons name="chevron-back" size={28} color={COLORS.gray[800]} />
            </TouchableOpacity>
          ) : (
            <View className="w-7 mr-3" />
          )}

          {/* Progress bar track — hidden when totalSteps is 0 */}
          {totalSteps > 0 ? (
            <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <View
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  backgroundColor: COLORS.primary[600],
                  borderRadius: 9999,
                }}
              />
            </View>
          ) : (
            <View className="flex-1" />
          )}
        </View>
      </View>

      {/* Title area */}
      <View className="px-6 pt-4 pb-6">
        {/* // MODIFIED: increased title font size from text-2xl (24pt) to 32pt for hero heading */}
        <Text
          style={{ fontSize: 32, lineHeight: 40 }} // MODIFIED: notably larger hero heading
          className="font-bold text-gray-900"
        >
          {title}
        </Text>
        {subtitle && (
          // MODIFIED: increased subtitle from text-base (16pt) to 18pt
          <Text
            style={{ fontSize: 18 }} // MODIFIED: subtitle bumped +2pt
            className="mt-2 text-gray-500"
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 px-6">{children}</View>
    </SafeAreaView>
  );
}
