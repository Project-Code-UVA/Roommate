/**
 * Tests for ExploreProfileView component.
 * Covers: EXPL-04 (full profile view from explore grid).
 *
 * Note: Mocks use require() inside factories to avoid NativeWind
 * babel transform _ReactNativeCSSInterop scope issues.
 */

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaView: require("react-native").View,
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: require("react-native").View,
  Gesture: { Pan: () => ({ activeOffsetX: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }) }) },
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native");
  return {
    default: {
      View: RN.View,
      createAnimatedComponent: (c: unknown) => c,
    },
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withSpring: (v: unknown) => v,
    withTiming: (v: unknown) => v,
    interpolate: () => 0,
    runOnJS: (fn: () => void) => fn,
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium" },
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: require("react-native").View,
}));

jest.mock("@/components/discovery/photo-indicator", () => ({
  PhotoIndicator: () => null,
}));

jest.mock("@/lib/constants", () => ({
  COLORS: {
    primary: { 50: "#f0f", 400: "#a0a", 500: "#909", 600: "#808" },
    gray: { 200: "#ccc", 300: "#aaa", 400: "#888", 700: "#333", 900: "#111" },
  },
}));

import * as React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import { ExploreProfileView } from "@/components/explore/explore-profile-view";
import type { DiscoveryProfile } from "@/types/filters";

const mockProfile: DiscoveryProfile = {
  user_id: "user-456",
  display_name: "Bob",
  bio: "Hello",
  year: "Senior",
  hometown: "Portland",
  nitty_gritty: null,
  completion_score: 0.9,
  mode_status: "roommate",
  selfie_verified: true,
  last_active_at: "2026-03-17T00:00:00Z",
  rank_score: 0.75,
  photos: [{ id: "p1", url: "https://example.com/bob.jpg", position: 0 }],
};

const mockNextProfile: DiscoveryProfile = {
  user_id: "user-789",
  display_name: "Alice",
  bio: "Hi there",
  year: "Junior",
  hometown: "Seattle",
  nitty_gritty: null,
  completion_score: 0.85,
  mode_status: "roommate",
  selfie_verified: false,
  last_active_at: "2026-03-16T00:00:00Z",
  rank_score: 0.6,
  photos: [{ id: "p2", url: "https://example.com/alice.jpg", position: 0 }],
};

describe("ExploreProfileView", () => {
  it("renders the current profile name", () => {
    const { getByText } = render(
      <ExploreProfileView
        profile={mockProfile}
        nextProfile={null}
        onLike={jest.fn()}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    expect(getByText("Bob")).toBeTruthy();
  });

  it("renders back button", () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ExploreProfileView
        profile={mockProfile}
        nextProfile={null}
        onLike={jest.fn()}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={onClose}
        visible
      />,
    );

    fireEvent.press(getByTestId("explore-profile-back"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders next profile behind current when provided", () => {
    const { getByText } = render(
      <ExploreProfileView
        profile={mockProfile}
        nextProfile={mockNextProfile}
        onLike={jest.fn()}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    expect(getByText("Bob")).toBeTruthy();
    expect(getByText("Alice")).toBeTruthy();
  });

  it("renders nothing when profile is null", () => {
    const { toJSON } = render(
      <ExploreProfileView
        profile={null}
        nextProfile={null}
        onLike={jest.fn()}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    expect(toJSON()).toBeNull();
  });
});
