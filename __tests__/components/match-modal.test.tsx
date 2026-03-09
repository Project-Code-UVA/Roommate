/**
 * Tests for MatchModal component.
 *
 * MTCH-02 — Match celebration modal with confetti, haptics, both photos,
 * heading, and 3 action buttons.
 */

import { render, fireEvent } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { MatchModal } from "@/components/match/match-modal";
import type { DiscoveryProfile } from "@/types/filters";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockProfile: DiscoveryProfile = {
  user_id: "matched-user-1",
  display_name: "Jane Doe",
  bio: "Love hiking and coffee",
  year: "Junior",
  hometown: "Austin, TX",
  nitty_gritty: null,
  completion_score: 85,
  mode_status: "roommate",
  selfie_verified: true,
  last_active_at: "2026-03-09T00:00:00Z",
  rank_score: 0.78,
  photos: [
    { id: "p1", url: "https://example.com/jane-1.jpg", position: 0 },
    { id: "p2", url: "https://example.com/jane-2.jpg", position: 1 },
  ],
};

const defaultProps = {
  visible: true,
  matchData: {
    matchId: "match-123",
    threadId: "thread-456",
    profile: mockProfile,
  },
  currentUserPhotoUrl: "https://example.com/me.jpg",
  onSendMessage: jest.fn(),
  onKeepSwiping: jest.fn(),
  onShare: jest.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MatchModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when visible prop is true", () => {
    const { getByText } = render(<MatchModal {...defaultProps} />);
    expect(getByText("It's a Match!")).toBeTruthy();
  });

  it("does not render content when visible prop is false", () => {
    const { queryByText } = render(
      <MatchModal {...defaultProps} visible={false} />,
    );
    expect(queryByText("It's a Match!")).toBeNull();
  });

  it("displays both user profile photos", () => {
    const { getByTestId } = render(<MatchModal {...defaultProps} />);
    expect(getByTestId("current-user-photo")).toBeTruthy();
    expect(getByTestId("matched-user-photo")).toBeTruthy();
  });

  it('displays "It\'s a Match!" heading', () => {
    const { getByText } = render(<MatchModal {...defaultProps} />);
    expect(getByText("It's a Match!")).toBeTruthy();
  });

  it("displays matched user name in subtext", () => {
    const { getByText } = render(<MatchModal {...defaultProps} />);
    expect(getByText(/Jane Doe/)).toBeTruthy();
  });

  it("renders Send a Message button", () => {
    const { getByText } = render(<MatchModal {...defaultProps} />);
    expect(getByText("Send a Message")).toBeTruthy();
  });

  it("renders Keep Swiping button", () => {
    const { getByText } = render(<MatchModal {...defaultProps} />);
    expect(getByText("Keep Swiping")).toBeTruthy();
  });

  it("renders Share button", () => {
    const { getByText } = render(<MatchModal {...defaultProps} />);
    expect(getByText("Share")).toBeTruthy();
  });

  it("calls onSendMessage when Send a Message pressed", () => {
    const onSendMessage = jest.fn();
    const { getByText } = render(
      <MatchModal {...defaultProps} onSendMessage={onSendMessage} />,
    );
    fireEvent.press(getByText("Send a Message"));
    expect(onSendMessage).toHaveBeenCalledTimes(1);
  });

  it("calls onKeepSwiping when Keep Swiping pressed", () => {
    const onKeepSwiping = jest.fn();
    const { getByText } = render(
      <MatchModal {...defaultProps} onKeepSwiping={onKeepSwiping} />,
    );
    fireEvent.press(getByText("Keep Swiping"));
    expect(onKeepSwiping).toHaveBeenCalledTimes(1);
  });

  it("calls onShare when Share pressed", () => {
    const onShare = jest.fn();
    const { getByText } = render(
      <MatchModal {...defaultProps} onShare={onShare} />,
    );
    fireEvent.press(getByText("Share"));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("fires heavy haptic feedback when becoming visible", () => {
    render(<MatchModal {...defaultProps} />);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Heavy,
    );
  });
});
