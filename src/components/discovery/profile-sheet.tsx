/**
 * Expanded profile bottom sheet.
 *
 * Opens when user taps a discovery card. Shows all photos in a
 * horizontal gallery, bio, year, hometown, and nitty-gritty
 * preferences as labeled chips.
 *
 * Uses @gorhom/bottom-sheet BottomSheetModal to avoid gesture
 * conflicts with the swipe deck.
 *
 * Per D-09/D-10: overflow menu with block/report in the header row.
 */

import { useRef, useCallback, useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";

import { COLORS } from "@/lib/constants";
import { FILTER_LABELS } from "@/constants/filter-options";
import { OverflowMenu } from "@/components/shared/overflow-menu";
import { ReportSheet } from "@/components/safety/report-sheet";
import { showBlockConfirmDialog } from "@/components/safety/block-confirm-dialog";
import { blockUser } from "@/services/block-service";
import { submitReport } from "@/services/report-service";
import { useSession } from "@/contexts/auth-context";
import type { DiscoveryProfile, FilterCategory } from "@/types/filters";
import type { OverflowMenuItem } from "@/types/safety";
import type { ReportCategory } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileSheetProps = {
  readonly profile: DiscoveryProfile | null;
  readonly visible: boolean;
  readonly onDismiss: () => void;
  readonly onPhotoTap: (photoUrl: string) => void;
  readonly onBlock?: () => void;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SNAP_POINTS = ["60%", "90%"];
const PHOTO_WIDTH = 240;
const PHOTO_HEIGHT = 320;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatOptionLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileSheet({
  profile,
  visible,
  onDismiss,
  onPhotoTap,
  onBlock,
}: ProfileSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // Block/report state
  const [reportVisible, setReportVisible] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const { session } = useSession();
  const userId = session?.user.id ?? "";

  useEffect(() => {
    if (visible && profile) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, profile]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  // Block/report handlers
  const handleBlock = useCallback(() => {
    if (!profile) return;
    showBlockConfirmDialog(profile.display_name, async () => {
      const result = await blockUser(userId, profile.user_id);
      if (result.success) {
        onDismiss();
        onBlock?.();
      }
    });
  }, [profile, userId, onDismiss, onBlock]);

  const handleReport = useCallback(() => {
    setReportVisible(true);
  }, []);

  const handleReportSubmit = useCallback(
    async (category: ReportCategory, description: string) => {
      if (!profile) return;
      setIsReporting(true);
      await submitReport(userId, profile.user_id, category, description);
      setIsReporting(false);
      setReportVisible(false);
    },
    [profile, userId],
  );

  const overflowItems: readonly OverflowMenuItem[] = [
    { label: "Block", icon: "ban-outline", onPress: handleBlock, destructive: true },
    { label: "Report", icon: "flag-outline", onPress: handleReport },
  ];

  if (!profile) {
    return null;
  }

  const nittyGritty = profile.nitty_gritty;

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: COLORS.gray[900],
        }}
        handleIndicatorStyle={{ backgroundColor: COLORS.gray[500] }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          className="px-4"
        >
          {/* Photo gallery */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {profile.photos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                onPress={() => onPhotoTap(photo.url)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: photo.url }}
                  style={{
                    width: PHOTO_WIDTH,
                    height: PHOTO_HEIGHT,
                    borderRadius: 16,
                  }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Name, verification, and overflow menu */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-2">
              <Text className="text-2xl font-bold text-white">
                {profile.display_name}
              </Text>
              {profile.selfie_verified && (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.primary[400]}
                />
              )}
            </View>
            <OverflowMenu items={overflowItems} testIDPrefix="profile-sheet" />
          </View>

          {/* Bio */}
          {profile.bio && (
            <View className="mb-4">
              <Text className="mb-1 text-sm font-semibold text-gray-400">
                About
              </Text>
              <Text className="text-base leading-6 text-gray-200">
                {profile.bio}
              </Text>
            </View>
          )}

          {/* Year and hometown */}
          <View className="mb-4 flex-row flex-wrap gap-3">
            {profile.year && (
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="school-outline"
                  size={16}
                  color={COLORS.gray[400]}
                />
                <Text className="text-sm text-gray-300">{profile.year}</Text>
              </View>
            )}
            {profile.hometown && (
              <View className="flex-row items-center gap-1">
                <Ionicons
                  name="location-outline"
                  size={16}
                  color={COLORS.gray[400]}
                />
                <Text className="text-sm text-gray-300">{profile.hometown}</Text>
              </View>
            )}
          </View>

          {/* Compatibility score */}
          <View className="mb-6 rounded-xl bg-gray-800 p-3">
            <Text className="mb-1 text-sm font-semibold text-gray-400">
              Compatibility
            </Text>
            <Text className="text-lg font-bold text-primary-400">
              {Math.round(profile.rank_score * 100)}% match
            </Text>
          </View>

          {/* Nitty-gritty preferences */}
          {nittyGritty && (
            <View>
              <Text className="mb-3 text-sm font-semibold text-gray-400">
                Preferences
              </Text>
              {(Object.keys(nittyGritty.self) as FilterCategory[]).map(
                (category) => {
                  const selfValue = nittyGritty.self[category];
                  if (!selfValue) return null;

                  return (
                    <View key={category} className="mb-3">
                      <Text className="mb-1 text-xs font-medium text-gray-500">
                        {FILTER_LABELS[category]}
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        <View className="rounded-full bg-primary-600/20 px-3 py-1">
                          <Text className="text-xs text-primary-300">
                            {formatOptionLabel(selfValue)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                },
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {/* Report sheet */}
      <ReportSheet
        visible={reportVisible}
        userName={profile.display_name}
        onSubmit={handleReportSubmit}
        onClose={() => setReportVisible(false)}
        isSubmitting={isReporting}
      />
    </>
  );
}
