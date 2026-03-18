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

jest.mock("@/components/discovery/profile-card", () => ({
  ProfileCard: (props: Record<string, unknown>) => {
    const RN = require("react-native");
    const profile = props.profile as Record<string, string>;
    return require("react").createElement(
      RN.View,
      { testID: "profile-card" },
      require("react").createElement(RN.Text, {}, profile.display_name),
    );
  },
}));

jest.mock("@/components/discovery/floating-actions", () => ({
  FloatingActions: (props: Record<string, () => void>) => {
    const RN = require("react-native");
    const R = require("react");
    return R.createElement(
      RN.View,
      { testID: "floating-actions" },
      R.createElement(
        RN.Pressable,
        { testID: "action-dismiss", onPress: props.onDismiss },
        R.createElement(RN.Text, {}, "X"),
      ),
      R.createElement(
        RN.Pressable,
        { testID: "action-like", onPress: props.onLike },
        R.createElement(RN.Text, {}, "Heart"),
      ),
      R.createElement(
        RN.Pressable,
        { testID: "action-message", onPress: props.onMessage },
        R.createElement(RN.Text, {}, "Msg"),
      ),
    );
  },
}));

import React from "react";
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

describe("ExploreProfileView", () => {
  it("renders ProfileCard with full profile data", () => {
    const { getByTestId, getByText } = render(
      <ExploreProfileView
        profile={mockProfile}
        onLike={jest.fn()}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    expect(getByTestId("profile-card")).toBeTruthy();
    expect(getByText("Bob")).toBeTruthy();
  });

  it("renders FloatingActions with like/dismiss/message", () => {
    const { getByTestId } = render(
      <ExploreProfileView
        profile={mockProfile}
        onLike={jest.fn()}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    expect(getByTestId("floating-actions")).toBeTruthy();
    expect(getByTestId("action-dismiss")).toBeTruthy();
    expect(getByTestId("action-like")).toBeTruthy();
  });

  it("calls onLike when like pressed", () => {
    const onLike = jest.fn();
    const { getByTestId } = render(
      <ExploreProfileView
        profile={mockProfile}
        onLike={onLike}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    fireEvent.press(getByTestId("action-like"));
    expect(onLike).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when profile is null", () => {
    const { queryByTestId } = render(
      <ExploreProfileView
        profile={null}
        onLike={jest.fn()}
        onDismiss={jest.fn()}
        onMessage={jest.fn()}
        onClose={jest.fn()}
        visible
      />,
    );

    expect(queryByTestId("profile-card")).toBeNull();
  });
});
