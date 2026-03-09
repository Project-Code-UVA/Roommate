/**
 * Photo indicator: segmented bar showing current photo position.
 *
 * Renders a horizontal row of thin bars at the top of a discovery card.
 * Active bar is bright white; inactive bars are semi-transparent.
 * Follows the Tinder/Instagram Stories pattern.
 */

import { View } from "react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoIndicatorProps = {
  readonly total: number;
  readonly current: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoIndicator({ total, current }: PhotoIndicatorProps) {
  if (total <= 1) return null;

  return (
    <View
      className="flex-row gap-1 px-2 pt-2"
      testID="photo-indicator"
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={`indicator-segment-${i}`}
          className={`h-0.5 flex-1 rounded-full ${
            i === current ? "bg-white" : "bg-white/40"
          }`}
        />
      ))}
    </View>
  );
}
