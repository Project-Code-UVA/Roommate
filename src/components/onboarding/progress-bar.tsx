import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { COLORS } from "@/lib/constants";

// Module-level cache so a newly-mounted screen picks up the previous bar
// value and animates forward, instead of snapping to its new target. During a
// stack slide transition, both the outgoing and incoming bars briefly read the
// same cached value, so visually it looks like one persistent bar.
let lastProgressPct = 0;

type Props = {
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly fillColor?: string;
  readonly trackStyle?: ViewStyle;
};

export function OnboardingProgressBar({
  currentStep,
  totalSteps,
  fillColor = COLORS.primary[600],
  trackStyle,
}: Props) {
  const target =
    totalSteps > 0
      ? Math.max(0, Math.min(100, ((currentStep + 1) / totalSteps) * 100))
      : 0;
  const pct = useSharedValue(lastProgressPct);

  useEffect(() => {
    if (target < pct.value) {
      // Reset without a reverse animation (e.g. returning to step 1).
      pct.value = target;
    } else {
      pct.value = withTiming(target, { duration: 320 });
    }
    lastProgressPct = target;
  }, [target, pct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${pct.value}%`,
  }));

  return (
    <View
      style={[
        {
          flex: 1,
          height: 8,
          backgroundColor: COLORS.gray[200],
          borderRadius: 9999,
          overflow: "hidden",
        },
        trackStyle,
      ]}
    >
      <Animated.View
        style={[
          fillStyle,
          { height: "100%", backgroundColor: fillColor, borderRadius: 9999 },
        ]}
      />
    </View>
  );
}
