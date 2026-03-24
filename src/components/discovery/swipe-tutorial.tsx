/**
 * Interactive floating tutorial — Hinge-style coach marks.
 *
 * Shows one step at a time with an animated icon.
 * Tap to advance through steps. Persists completion in AsyncStorage.
 *
 * Steps:
 * 1. Scroll down → Explore profile
 * 2. Tap X → Pass
 * 3. Tap Heart → Like
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "room:discovery_tutorial_seen_v4";

type Step = {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly iconColor: string;
  readonly title: string;
  readonly subtitle: string;
  readonly animType: "scroll" | "pulse" | "bounce";
};

const STEPS: readonly Step[] = [
  {
    icon: "arrow-forward-circle",
    iconColor: "#4ade80",
    title: "Swipe right to like",
    subtitle: "Show interest in a potential roommate",
    animType: "bounce",
  },
  {
    icon: "arrow-back-circle",
    iconColor: "#ef4444",
    title: "Swipe left to pass",
    subtitle: "Skip this profile and see the next one",
    animType: "pulse",
  },
  {
    icon: "swap-vertical",
    iconColor: "#fff",
    title: "Scroll to explore",
    subtitle: "Browse photos and profile details",
    animType: "scroll",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SwipeTutorial() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const handAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value !== "true") {
        setVisible(true);
      }
    });
  }, []);

  // Animate on each step
  useEffect(() => {
    if (!visible) return;

    handAnim.setValue(0);
    fadeAnim.setValue(0);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(handAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(handAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loopAnimation.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    return () => {
      loopAnimation.stop();
      pulseLoop.stop();
    };
  }, [visible, stepIndex, handAnim, fadeAnim, pulseAnim]);

  const handleTap = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setStepIndex((prev) => prev + 1);
      });
    } else {
      setVisible(false);
      AsyncStorage.setItem(STORAGE_KEY, "true");
    }
  }, [stepIndex, fadeAnim]);

  if (!visible) return null;

  const step = STEPS[stepIndex];

  const iconTransform = (() => {
    switch (step.animType) {
      case "scroll":
        return {
          translateY: handAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -20],
          }),
        };
      case "pulse":
        return {
          scale: handAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.8, 1],
          }),
        };
      case "bounce":
        return {
          scale: handAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.2, 1],
          }),
        };
    }
  })();

  return (
    <Pressable style={styles.overlay} onPress={handleTap}>
      <Animated.View style={[styles.coachMark, { opacity: fadeAnim }]}>
        {/* Animated icon */}
        <Animated.View
          style={[styles.handContainer, { transform: [iconTransform] }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: `${step.iconColor}20` }]}>
            <Ionicons name={step.icon} size={28} color={step.iconColor} />
          </View>
        </Animated.View>

        {/* Text */}
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === stepIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Tap hint */}
        <Animated.Text style={[styles.tapHint, { opacity: pulseAnim }]}>
          Tap to continue
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  coachMark: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  handContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#fff",
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tapHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginTop: 16,
  },
});
