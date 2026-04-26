/**
 * Likes tab screen with manila-folder sub-tabs.
 *
 * Three sub-tabs: Matches, Liked Me, My Likes.
 * Active tab appears "in front" like a physical file folder tab.
 * - Matches: List of matched threads, tap to open chat.
 * - Liked Me: Blurred photo grid with paywall overlay (always shown for free users).
 * - My Likes: Grid of profiles the user has liked, tap to view detail.
 */

import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/contexts/auth-context";
import { useLikes } from "@/hooks/use-likes";
import { MatchesRow } from "@/components/likes/matches-row";
import { LikedMeCard } from "@/components/likes/liked-me-card";
import { MyLikesCard } from "@/components/likes/my-likes-card";
import { ProfileDetailModal } from "@/components/likes/profile-detail-modal";
import { getProfileDetail } from "@/services/explore-service";
import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile } from "@/types/filters";
import type { LikedMeProfile } from "@/types/explore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GRID_GAP = 6;
const GRID_PADDING = 16;
const GRID_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_SIZE = Math.floor(
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS,
);

type SubTab = "matches" | "liked-me" | "my-likes";

const TABS: readonly { readonly key: SubTab; readonly label: string }[] = [
  { key: "matches", label: "Matches" },
  { key: "liked-me", label: "Liked Me" },
  { key: "my-likes", label: "My Likes" },
];

// Tab content area background — matches the "paper" behind the folder
const CONTENT_BG = "#fff";
const TAB_INACTIVE_BG = COLORS.gray[200];
const TAB_ACTIVE_BG = CONTENT_BG;

// ---------------------------------------------------------------------------
// Manila Folder Tab Bar
// ---------------------------------------------------------------------------

function FolderTabBar({
  activeTab,
  onTabChange,
  matchCount,
  likedMeCount,
  myLikesCount,
}: {
  readonly activeTab: SubTab;
  readonly onTabChange: (tab: SubTab) => void;
  readonly matchCount: number;
  readonly likedMeCount: number;
  readonly myLikesCount: number;
}) {
  const counts: Record<SubTab, number> = {
    matches: matchCount,
    "liked-me": likedMeCount,
    "my-likes": myLikesCount,
  };

  // Order tabs so the active one renders last (on top)
  const orderedTabs = [...TABS].sort((a, b) => {
    if (a.key === activeTab) return 1;
    if (b.key === activeTab) return -1;
    return 0;
  });

  // Positional index for each tab (always: 0, 1, 2 left-to-right)
  const tabPositions: Record<SubTab, number> = {
    matches: 0,
    "liked-me": 1,
    "my-likes": 2,
  };

  const TAB_WIDTH = (SCREEN_WIDTH - 32) / 3; // 16px padding each side

  return (
    <View style={folderStyles.wrapper}>
      {/* Tab row */}
      <View style={folderStyles.tabRow}>
        {orderedTabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const position = tabPositions[tab.key];
          const count = counts[tab.key];

          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              testID={`tab-${tab.key}`}
              style={[
                folderStyles.tab,
                {
                  left: 16 + position * TAB_WIDTH,
                  width: TAB_WIDTH,
                  zIndex: isActive ? 10 : position,
                  backgroundColor: isActive ? TAB_ACTIVE_BG : TAB_INACTIVE_BG,
                  bottom: isActive ? -1 : 2,
                  borderBottomWidth: isActive ? 0 : 1,
                  borderBottomColor: isActive ? "transparent" : COLORS.gray[300],
                },
              ]}
            >
              <Text
                style={[
                  folderStyles.tabText,
                  isActive && folderStyles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    folderStyles.badge,
                    isActive && folderStyles.activeBadge,
                  ]}
                >
                  <Text
                    style={[
                      folderStyles.badgeText,
                      isActive && folderStyles.activeBadgeText,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Content border — the "folder body" top edge */}
      <View style={folderStyles.contentBorder} />
    </View>
  );
}

const FOLDER_TAB_HEIGHT = 40;

const folderStyles = StyleSheet.create({
  wrapper: {
    paddingTop: 8,
    position: "relative",
  },
  tabRow: {
    height: FOLDER_TAB_HEIGHT + 4,
    position: "relative",
  },
  tab: {
    position: "absolute",
    height: FOLDER_TAB_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    paddingHorizontal: 8,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[500],
  },
  activeTabText: {
    color: COLORS.primary[600],
    fontWeight: "700",
  },
  badge: {
    backgroundColor: COLORS.gray[300],
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  activeBadge: {
    backgroundColor: COLORS.primary[100],
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.gray[600],
  },
  activeBadgeText: {
    color: COLORS.primary[600],
  },
  contentBorder: {
    height: 1,
    backgroundColor: COLORS.gray[300],
    marginHorizontal: 16,
  },
});

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ message }: { readonly message: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Placeholder blurred cards for Liked Me teaser
// ---------------------------------------------------------------------------

const PLACEHOLDER_COLORS = [
  "#c4b5fd",
  "#a78bfa",
  "#818cf8",
  "#6366f1",
  "#8b5cf6",
  "#7c3aed",
  "#ddd6fe",
  "#c084fc",
  "#a855f7",
];

function PlaceholderBlurGrid() {
  return (
    <View testID="liked-me-placeholder-grid" style={styles.grid}>
      {PLACEHOLDER_COLORS.map((color, i) => (
        <View
          key={i}
          style={[
            placeholderStyles.card,
            { width: CARD_SIZE, height: CARD_SIZE, backgroundColor: color },
          ]}
        >
          <BlurView
            intensity={80}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        </View>
      ))}
    </View>
  );
}

const placeholderStyles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: "hidden",
  },
});

// ---------------------------------------------------------------------------
// Liked Me Paywall Overlay
// ---------------------------------------------------------------------------

function LikedMePaywall({
  count,
  onUpgrade,
}: {
  readonly count: number;
  readonly onUpgrade: () => void;
}) {
  return (
    <View style={paywallStyles.container}>
      <View style={paywallStyles.card}>
        <View style={paywallStyles.iconWrap}>
          <Ionicons name="lock-closed" size={28} color="#d97706" />
        </View>
        <Text style={paywallStyles.title}>
          {count > 0
            ? `${count} ${count === 1 ? "person has" : "people have"} liked you`
            : "See who likes you"}
        </Text>
        <Text style={paywallStyles.subtitle}>
          Upgrade to Room+ to reveal who liked you and match instantly
        </Text>
        <Pressable
          style={paywallStyles.button}
          onPress={onUpgrade}
          testID="paywall-upgrade-button"
        >
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={paywallStyles.buttonText}>Upgrade to Room+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const paywallStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fffbeb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.gray[800],
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 19,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f59e0b",
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LikesScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<SubTab>("matches");
  const [viewingProfile, setViewingProfile] = useState<DiscoveryProfile | null>(
    null,
  );

  const {
    matches,
    myLikes,
    likedMe,
    likedMeCount,
    isLoading,
    isRefreshing,
    refresh,
    isPaid,
  } = useLikes(userId);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleUpgrade = useCallback(() => {
    Alert.alert("Coming Soon", "Premium features launching soon!");
  }, []);

  const handleSelectLikedMe = useCallback((_profile: LikedMeProfile) => {
    // TODO: Phase 9 — navigate to profile view for paid users
  }, []);

  const handlePressMatch = useCallback(
    (
      threadId: string,
      otherUserId: string,
      otherName: string,
      otherAvatar: string | null,
    ) => {
      router.push(
        `/chat/${threadId}?otherUserId=${otherUserId}&otherName=${encodeURIComponent(otherName)}&otherAvatar=${encodeURIComponent(otherAvatar ?? "")}` as never,
      );
    },
    [router],
  );

  const handlePressMyLike = useCallback(
    async (targetId: string) => {
      try {
        const result = await getProfileDetail(userId, targetId);
        if (result.data) {
          setViewingProfile(result.data);
        } else {
          Alert.alert("Error", "Profile is no longer available.");
        }
      } catch {
        Alert.alert("Error", "Could not load profile. Please try again.");
      }
    },
    [userId],
  );

  // -------------------------------------------------------------------------
  // Loading
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator
          testID="likes-loading"
          size="large"
          color={COLORS.primary[500]}
        />
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Tab content renderers
  // -------------------------------------------------------------------------

  const renderMatchesTab = () => (
    <ScrollView
      testID="matches-scroll"
      style={styles.tabContent}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {matches.length === 0 ? (
        <EmptyState message="No matches yet. Keep exploring!" />
      ) : (
        <View testID="matches-list">
          {matches.map((thread) => (
            <MatchesRow
              key={thread.id}
              thread={thread}
              currentUserId={userId}
              onPress={() =>
                handlePressMatch(
                  thread.id,
                  thread.other_user_id,
                  thread.other_user_display_name,
                  thread.other_user_avatar_url,
                )
              }
            />
          ))}
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  const renderLikedMeTab = () => {
    // For free users: always show blurred grid + paywall, even with 0 real likes
    const hasRealProfiles = likedMe.length > 0;

    return (
      <View style={styles.tabContent}>
        <View style={styles.likedMeContainer}>
          <ScrollView
            testID="liked-me-scroll"
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
            }
            showsVerticalScrollIndicator={false}
          >
            {hasRealProfiles ? (
              <View testID="liked-me-grid" style={styles.grid}>
                {likedMe.map((profile) => (
                  <LikedMeCard
                    key={profile.user_id}
                    profile={profile}
                    isPaid={isPaid}
                    onUpgrade={handleUpgrade}
                    onSelect={handleSelectLikedMe}
                    size={CARD_SIZE}
                  />
                ))}
              </View>
            ) : (
              <PlaceholderBlurGrid />
            )}
            <View style={styles.bottomSpacer} />
          </ScrollView>

          {/* Paywall overlay for free users */}
          {!isPaid && (
            <LikedMePaywall count={likedMeCount} onUpgrade={handleUpgrade} />
          )}
        </View>
      </View>
    );
  };

  const renderMyLikesTab = () => (
    <ScrollView
      testID="my-likes-scroll"
      style={styles.tabContent}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {myLikes.length === 0 ? (
        <EmptyState message="You haven't liked anyone yet. Explore profiles!" />
      ) : (
        <View testID="my-likes-grid" style={styles.grid}>
          {myLikes.map((like) => (
            <MyLikesCard
              key={like.user_id}
              like={like}
              onPress={() => handlePressMyLike(like.user_id)}
              size={CARD_SIZE}
            />
          ))}
        </View>
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.screenTitle} testID="likes-title">
        Likes
      </Text>

      {/* Manila folder tab bar */}
      <FolderTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        matchCount={matches.length}
        likedMeCount={likedMeCount}
        myLikesCount={myLikes.length}
      />

      {/* Tab content */}
      {activeTab === "matches" && renderMatchesTab()}
      {activeTab === "liked-me" && renderLikedMeTab()}
      {activeTab === "my-likes" && renderMyLikesTab()}

      {/* Profile detail modal */}
      <ProfileDetailModal
        profile={viewingProfile}
        onClose={() => setViewingProfile(null)}
        visible={viewingProfile !== null}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gray[900],
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray[400],
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  likedMeContainer: {
    flex: 1,
    position: "relative",
  },
  bottomSpacer: {
    height: 100,
  },
});
