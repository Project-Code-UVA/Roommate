/**
 * Floating action buttons for discovery swipe card.
 *
 * Three circular buttons positioned at bottom-right:
 * dismiss (X), save (bookmark), like (heart).
 * Semi-transparent dark background for contrast over photos.
 */

import { View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CardActionButtonsProps = {
  readonly onDismiss: () => void;
  readonly onSave: () => void;
  readonly onLike: () => void;
  readonly isSaved?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CardActionButtons({
  onDismiss,
  onSave,
  onLike,
  isSaved = false,
}: CardActionButtonsProps) {
  return (
    <View className="absolute bottom-6 right-4 gap-3">
      <IconButton
        icon="close-outline"
        size={20}
        color={COLORS.white}
        bgColor="rgba(0,0,0,0.5)"
        onPress={onDismiss}
        testID="action-dismiss"
      />
      <IconButton
        icon={isSaved ? "bookmark" : "bookmark-outline"}
        size={20}
        color={isSaved ? COLORS.primary[400] : COLORS.white}
        bgColor="rgba(0,0,0,0.5)"
        onPress={onSave}
        testID="action-save"
      />
      <IconButton
        icon="heart-outline"
        size={20}
        color={COLORS.white}
        bgColor="rgba(0,0,0,0.5)"
        onPress={onLike}
        testID="action-like"
      />
    </View>
  );
}
