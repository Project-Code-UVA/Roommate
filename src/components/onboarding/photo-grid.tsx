/**
 * Draggable photo grid for onboarding.
 *
 * Shows 3 required slots initially, expanding to 9 after all 3 are filled.
 * Supports long-press drag to reorder with haptic feedback.
 * First slot is always the profile photo (indicated by badge).
 */

import { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export type PhotoSlot = {
  readonly id: string;
  readonly uri: string;
  readonly uploaded: boolean;
} | null;

type PhotoGridProps = {
  readonly photos: readonly PhotoSlot[];
  readonly onAdd: (index: number) => void;
  readonly onRemove: (index: number) => void;
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
  readonly uploading?: ReadonlySet<number>;
};

const GRID_COLUMNS = 3;
const GRID_GAP = 12;
const SCREEN_PADDING = 48; // 24px on each side from StepContainer px-6
const SLOT_SIZE =
  (Dimensions.get("window").width - SCREEN_PADDING - GRID_GAP * (GRID_COLUMNS - 1)) /
  GRID_COLUMNS;

function getSlotPosition(index: number) {
  "use strict";
  const col = index % GRID_COLUMNS;
  const row = Math.floor(index / GRID_COLUMNS);
  return {
    x: col * (SLOT_SIZE + GRID_GAP),
    y: row * (SLOT_SIZE + GRID_GAP),
  };
}

function findTargetIndex(x: number, y: number, totalSlots: number): number {
  "use strict";
  const col = Math.round(x / (SLOT_SIZE + GRID_GAP));
  const row = Math.round(y / (SLOT_SIZE + GRID_GAP));
  const clampedCol = Math.max(0, Math.min(col, GRID_COLUMNS - 1));
  const clampedRow = Math.max(0, Math.min(row, Math.ceil(totalSlots / GRID_COLUMNS) - 1));
  const target = clampedRow * GRID_COLUMNS + clampedCol;
  return Math.min(target, totalSlots - 1);
}

type DraggableSlotProps = {
  readonly slot: PhotoSlot;
  readonly index: number;
  readonly totalFilledSlots: number;
  readonly onAdd: (index: number) => void;
  readonly onRemove: (index: number) => void;
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
  readonly isUploading: boolean;
};

function DraggableSlot({
  slot,
  index,
  totalFilledSlots,
  onAdd,
  onRemove,
  onReorder,
  isUploading,
}: DraggableSlotProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const isActive = useSharedValue(false);

  const startPosition = useRef({ x: 0, y: 0 });

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleReorder = useCallback(
    (toIndex: number) => {
      if (toIndex !== index && toIndex < totalFilledSlots) {
        onReorder(index, toIndex);
      }
    },
    [index, totalFilledSlots, onReorder],
  );

  const gesture = Gesture.Pan()
    .activateAfterLongPress(300)
    .enabled(slot !== null && !isUploading)
    .onStart(() => {
      isActive.value = true;
      zIndex.value = 100;
      scale.value = withSpring(1.05);
      const pos = getSlotPosition(index);
      startPosition.current = pos;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const currentX = startPosition.current.x + event.translationX;
      const currentY = startPosition.current.y + event.translationY;
      const targetIndex = findTargetIndex(currentX, currentY, totalFilledSlots);

      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      isActive.value = false;

      if (targetIndex !== index) {
        runOnJS(handleReorder)(targetIndex);
      }
    })
    .onFinalize(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
      scale.value = withSpring(1);
      zIndex.value = 0;
      isActive.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
    elevation: isActive.value ? 10 : 0,
    shadowOpacity: withTiming(isActive.value ? 0.3 : 0),
    shadowRadius: withTiming(isActive.value ? 8 : 0),
  }));

  if (slot === null) {
    return (
      <Pressable
        onPress={() => onAdd(index)}
        className="items-center justify-center rounded-xl border-2 border-dashed border-gray-300"
        style={{ width: SLOT_SIZE, height: SLOT_SIZE }}
        accessibilityRole="button"
        accessibilityLabel={`Add photo ${index + 1}`}
      >
        <Ionicons name="add" size={32} color="#9CA3AF" />
      </Pressable>
    );
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[{ width: SLOT_SIZE, height: SLOT_SIZE }, animatedStyle]}
      >
        <View className="relative h-full w-full overflow-hidden rounded-xl">
          <Image
            source={{ uri: slot.uri }}
            className="h-full w-full"
            resizeMode="cover"
          />

          {isUploading ? (
            <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-xl">
              <Text className="text-white text-sm font-medium">Uploading...</Text>
            </View>
          ) : null}

          {/* Remove button */}
          <Pressable
            onPress={() => onRemove(index)}
            className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-black/50"
            accessibilityRole="button"
            accessibilityLabel={`Remove photo ${index + 1}`}
            hitSlop={8}
          >
            <Ionicons name="close" size={14} color="#FFFFFF" />
          </Pressable>

          {/* Profile photo badge */}
          {index === 0 ? (
            <View className="absolute bottom-1 left-1/2 -translate-x-1/2">
              <View className="rounded-full bg-purple-600 px-2 py-0.5">
                <Text className="text-xs font-medium text-white">Profile</Text>
              </View>
            </View>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const MAX_PHOTOS = 9;
const MIN_REQUIRED = 3;

export function PhotoGrid({
  photos,
  onAdd,
  onRemove,
  onReorder,
  uploading = new Set<number>(),
}: PhotoGridProps) {
  const filledCount = photos.filter((p) => p !== null).length;

  // Initially show 3 slots. After all 3 are filled, allow expanding up to 9.
  const showAddMore = filledCount >= MIN_REQUIRED && photos.length < MAX_PHOTOS;

  // Calculate the number of visible slots
  const visibleSlots = photos.length;

  const rows = Math.ceil(visibleSlots / GRID_COLUMNS);
  const gridHeight = rows * SLOT_SIZE + (rows - 1) * GRID_GAP;

  return (
    <View>
      <View
        className="flex-row flex-wrap"
        style={{
          height: gridHeight,
          gap: GRID_GAP,
        }}
      >
        {photos.map((slot, index) => (
          <DraggableSlot
            key={slot?.id ?? `empty-${index}`}
            slot={slot}
            index={index}
            totalFilledSlots={filledCount}
            onAdd={onAdd}
            onRemove={onRemove}
            onReorder={onReorder}
            isUploading={uploading.has(index)}
          />
        ))}
      </View>

      {showAddMore ? (
        <Pressable
          onPress={() => onAdd(photos.length)}
          className="mt-3 flex-row items-center justify-center rounded-lg border border-gray-300 py-2"
          accessibilityRole="button"
          accessibilityLabel="Add more photos"
        >
          <Ionicons name="add" size={20} color="#6B7280" />
          <Text className="ml-1 text-sm text-gray-500">Add more photos</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
