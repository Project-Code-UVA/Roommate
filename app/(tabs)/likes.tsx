/**
 * Likes tab screen — three sections on a single scrollable page.
 *
 * - Matches: 4-column mini grid of matched threads
 * - Liked Me: blurred paywall for free users, list for paid users
 * - Your Likes: 2-column grid of profiles you've liked
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
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "@/contexts/auth-context";
import { useLikes } from "@/hooks/use-likes";
import { ProfileDetailModal } from "@/components/likes/profile-detail-modal";
import { getProfileDetail } from "@/services/explore-service";
import { COLORS } from "@/lib/constants";
import type { DiscoveryProfile } from "@/types/filters";
import type { LikedMeProfile, MyLike } from "@/types/explore";
import type { EnrichedThread } from "@/services/thread-service";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const H_PADDING = 20;

// Match mini cards (4 col)
const MATCH_GAP = 8;
const MATCH_COLS = 4;
const MATCH_CARD_SIZE =
  (SCREEN_WIDTH - H_PADDING * 2 - MATCH_GAP * (MATCH_COLS - 1)) / MATCH_COLS;

// My Likes grid (2 col)
const LIKES_GAP = 10;
const LIKES_COLS = 2;
const LIKES_CARD_SIZE =
  (SCREEN_WIDTH - H_PADDING * 2 - LIKES_GAP * (LIKES_COLS - 1)) / LIKES_COLS;

// Liked Me placeholder colors
const PLACEHOLDER_COLORS = [
  "#c4b5fd", "#a78bfa", "#818cf8",
  "#6366f1", "#8b5cf6", "#7c3aed",
  "#ddd6fe", "#c084fc", "#a855f7",
];

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({
  icon,
  iconBg,
  title,
}: {
  readonly icon: React.ComponentProps<typeof Ionicons>["name"];
  readonly iconBg: readonly [string, string];
  readonly title: string;
}) {
  return (
    <View style={sectionStyles.header}>
      <LinearGradient colors={iconBg as [string, string]} style={sectionStyles.iconWrap}>
        <Ionicons name={icon} size={16} color="#fff" />
      </LinearGradient>
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray[900],
  },
});

// ---------------------------------------------------------------------------
// Match mini card (4-col)
// ---------------------------------------------------------------------------

function MatchMiniCard({
  thread,
  onPress,
}: {
  readonly thread: EnrichedThread;
  readonly onPress: () => void;
}) {
  const firstName = thread.other_user_display_name.split(" ")[0];
  return (
    <Pressable style={matchStyles.card} onPress={onPress}>
      {thread.other_user_avatar_url ? (
        <Image
          source={{ uri: thread.other_user_avatar_url }}
          style={matchStyles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[matchStyles.image, matchStyles.imageFallback]}>
          <Ionicons name="person" size={28} color={COLORS.gray[400]} />
        </View>
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.65)"]}
        style={matchStyles.gradient}
      >
        <Text style={matchStyles.name} numberOfLines={1}>
          {firstName}
        </Text>
      </LinearGradient>
      {thread.unread_count > 0 && <View style={matchStyles.onlineDot} />}
    </Pressable>
  );
}

const matchStyles = StyleSheet.create({
  card: {
    width: MATCH_CARD_SIZE,
    height: MATCH_CARD_SIZE * 1.35,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.gray[200],
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 5,
    paddingBottom: 5,
    paddingTop: 20,
  },
  name: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});

// ---------------------------------------------------------------------------
// Liked Me list row (paid only)
// ---------------------------------------------------------------------------

function LikedMeRow({
  profile,
  onLike,
}: {
  readonly profile: LikedMeProfile;
  readonly onLike: () => void;
}) {
  return (
    <View style={likedMeStyles.row}>
      <View style={likedMeStyles.avatarWrap}>
        <Image
          source={{ uri: profile.photo_url }}
          style={likedMeStyles.avatar}
          resizeMode="cover"
        />
        <View style={likedMeStyles.heartBadge}>
          <Ionicons name="heart" size={10} color="#fff" />
        </View>
      </View>
      <View style={likedMeStyles.info}>
        <Text style={likedMeStyles.name} numberOfLines={1}>
          {profile.display_name ?? "Someone"}
        </Text>
      </View>
      <Pressable style={likedMeStyles.likeBtn} onPress={onLike} hitSlop={8}>
        <LinearGradient
          colors={[COLORS.primary[500], "#ec4899"]}
          style={likedMeStyles.likeBtnGradient}
        >
          <Ionicons name="heart" size={18} color="#fff" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const likedMeStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.gray[200],
  },
  heartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary[500],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[900],
  },
  likeBtn: {},
  likeBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ---------------------------------------------------------------------------
// Liked Me paywall
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
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.97)",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    width: "100%",
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
// My Likes card (2-col)
// ---------------------------------------------------------------------------

function MyLikeCard({
  like,
  onPress,
}: {
  readonly like: MyLike;
  readonly onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.myLikeCard, { width: LIKES_CARD_SIZE, height: LIKES_CARD_SIZE * 1.45 }]}
      onPress={onPress}
    >
      <Image
        source={{ uri: like.photo_url }}
        style={styles.myLikeImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.75)"]}
        style={styles.myLikeGradient}
      >
        <Text style={styles.myLikeName} numberOfLines={1}>
          {like.display_name}
        </Text>
        {like.year && (
          <Text style={styles.myLikeYear}>{like.year}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Placeholder blur grid for Liked Me
// ---------------------------------------------------------------------------

function PlaceholderBlurGrid() {
  return (
    <View testID="liked-me-placeholder-grid" style={styles.placeholderGrid}>
      {PLACEHOLDER_COLORS.map((color, i) => (
        <View
          key={i}
          style={[
            styles.placeholderCard,
            { width: LIKES_CARD_SIZE, height: LIKES_CARD_SIZE, backgroundColor: color },
          ]}
        >
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function LikesScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const router = useRouter();

  const [viewingProfile, setViewingProfile] = useState<DiscoveryProfile | null>(null);

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

  const handlePressMatch = useCallback(
    (thread: EnrichedThread) => {
      router.push(
        `/chat/${thread.id}?otherUserId=${thread.other_user_id}&otherName=${encodeURIComponent(thread.other_user_display_name)}&otherAvatar=${encodeURIComponent(thread.other_user_avatar_url ?? "")}` as never,
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

  const handleLikedMeLike = useCallback((_profile: LikedMeProfile) => {
    // TODO: Phase 9 — like back action for paid users
  }, []);

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
  // Render
  // -------------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Gradient background */}
      <LinearGradient
        colors={["#fff1f2", "#fdf2f8", "#fff"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle} testID="likes-title">
          Likes
        </Text>
        {likedMeCount > 0 && (
          <Text style={styles.subtitle}>
            {likedMeCount} {likedMeCount === 1 ? "person likes" : "people like"} you
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={COLORS.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Matches ── */}
        {matches.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              icon="heart"
              iconBg={[COLORS.primary[500], "#ec4899"]}
              title={`Matches (${matches.length})`}
            />
            <View style={styles.matchesGrid} testID="matches-list">
              {matches.map((thread) => (
                <MatchMiniCard
                  key={thread.id}
                  thread={thread}
                  onPress={() => handlePressMatch(thread)}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── Liked You ── */}
        <View style={styles.section}>
          <SectionHeader
            icon="star"
            iconBg={["#f59e0b", "#ef4444"]}
            title={`Liked You (${likedMeCount})`}
          />
          <View style={styles.likedMeContainer}>
            {isPaid && likedMe.length > 0 ? (
              <View testID="liked-me-list">
                {likedMe.map((profile) => (
                  <LikedMeRow
                    key={profile.user_id}
                    profile={profile}
                    onLike={() => handleLikedMeLike(profile)}
                  />
                ))}
              </View>
            ) : (
              <PlaceholderBlurGrid />
            )}
            {!isPaid && (
              <LikedMePaywall count={likedMeCount} onUpgrade={handleUpgrade} />
            )}
          </View>
        </View>

        {/* ── Your Likes ── */}
        <View style={styles.section}>
          <SectionHeader
            icon="time-outline"
            iconBg={["#3b82f6", "#06b6d4"]}
            title={`Your Likes (${myLikes.length})`}
          />
          {myLikes.length === 0 ? (
            <Text style={styles.emptyText}>
              You haven't liked anyone yet. Explore profiles!
            </Text>
          ) : (
            <View testID="my-likes-grid" style={styles.likesGrid}>
              {myLikes.map((like) => (
                <MyLikeCard
                  key={like.user_id}
                  like={like}
                  onPress={() => handlePressMyLike(like.user_id)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
    backgroundColor: "#fff1f2",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
    paddingBottom: 4,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.gray[900],
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: H_PADDING,
    marginBottom: 28,
  },
  // Matches grid
  matchesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MATCH_GAP,
  },
  // Liked Me
  likedMeContainer: {
    position: "relative",
    minHeight: LIKES_CARD_SIZE + 20,
  },
  placeholderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: LIKES_GAP,
  },
  placeholderCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  // My Likes grid
  likesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: LIKES_GAP,
  },
  myLikeCard: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  myLikeImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.gray[200],
  },
  myLikeGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingBottom: 12,
    paddingTop: 40,
  },
  myLikeName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  myLikeYear: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[400],
    textAlign: "center",
    paddingVertical: 24,
  },
  bottomSpacer: {
    height: 100,
  },
});
