/**
 * Segmented progress bar for onboarding flow.
 *
 * Renders thin segments that fill purple as steps complete.
 * verify-otp is grouped with phone visually, so 7 visible segments.
 */

import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

/** Number of visible segments (verify-otp grouped with phone). */
const VISIBLE_SEGMENTS = 7;

type ProgressBarProps = {
  readonly currentStep: number;
  readonly totalSteps?: number;
};

function Segment({
  isFilled,
  isCurrent,
}: {
  readonly isFilled: boolean;
  readonly isCurrent: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const targetWidth = isFilled ? "100%" : isCurrent ? "50%" : "0%";

    return {
      width: withTiming(targetWidth, { duration: 300 }),
    };
  }, [isFilled, isCurrent]);

  return (
    <View className="mx-0.5 h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
      <Animated.View
        className="h-full rounded-full bg-primary-600"
        style={animatedStyle}
      />
    </View>
  );
}

export function ProgressBar({
  currentStep,
  totalSteps = VISIBLE_SEGMENTS,
}: ProgressBarProps) {
  return (
    <View className="flex-row px-6 py-2">
      {Array.from({ length: totalSteps }, (_, i) => (
        <Segment
          key={i}
          isFilled={i < currentStep}
          isCurrent={i === currentStep}
        />
      ))}
    </View>
  );
}
