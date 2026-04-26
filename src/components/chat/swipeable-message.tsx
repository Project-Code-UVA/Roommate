/**
 * SwipeableMessage — wraps a message bubble with a right-swipe gesture.
 *
 * When the user swipes right past the threshold (50px):
 * 1. A reply icon animates in on the left
 * 2. A haptic impact fires to confirm the trigger
 * 3. onSwipeToReply() is called
 * 4. The swipeable snaps back closed
 *
 * The reply icon scales from 0→1 as the user drags, giving tactile feedback.
 */

import React, { useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = {
  readonly children: React.ReactNode;
  readonly onSwipeToReply: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeableMessage({ children, onSwipeToReply }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  /**
   * Renders the reply icon that appears on the left while swiping.
   * The icon scales from 0 to 1 as drag distance goes 0→60px so the
   * user gets visual confirmation of the incoming action.
   */
  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 60],
      outputRange: [0.3, 1],
      extrapolate: "clamp",
    });

    const opacity = dragX.interpolate({
      inputRange: [0, 40],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    return (
      <View style={styles.leftActionContainer}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <Ionicons name="arrow-undo" size={18} color={COLORS.primary[600]} />
        </Animated.View>
      </View>
    );
  };

  const handleSwipeableOpen = () => {
    // Fire haptic to confirm the swipe crossed the threshold
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSwipeToReply();
    // Snap back closed immediately so the UI doesn't stay in open state
    swipeableRef.current?.close();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableLeftOpen={handleSwipeableOpen}
      overshootLeft={false}
      friction={2}
      leftThreshold={50}
    >
      {children}
    </Swipeable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  leftActionContainer: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 4,
    width: 52,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary[100],
    alignItems: "center",
    justifyContent: "center",
  },
});
