import { useState } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/constants";

export type PhotoSlot = { id: string; uri: string; uploaded: boolean } | null;

interface PhotoGridProps {
  photos: PhotoSlot[];
  onAdd: (index: number) => void;
  onRemove: (index: number) => void;
  onReorder?: (next: PhotoSlot[]) => void;
}

const MAX_SLOTS = 9;
const COLUMNS = 3;
const GAP = 10;
const REQUIRED_COUNT = 3;

export function PhotoGrid({ photos, onAdd, onRemove, onReorder }: PhotoGridProps) {
  const { width } = useWindowDimensions();
  const gridPadding = 48; // px-6 on each side
  const slotSize = (width - gridPadding - GAP * (COLUMNS - 1)) / COLUMNS;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filledCount = photos.filter(Boolean).length;

  const handlePhotoPress = (index: number) => {
    if (!onReorder) return;
    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }
    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }
    const next = [...photos];
    const a = next[selectedIndex];
    const b = next[index];
    next[selectedIndex] = b ?? null;
    next[index] = a ?? null;
    setSelectedIndex(null);
    onReorder(next);
  };

  // Show: all filled slots + one empty "add" slot (up to MAX_SLOTS)
  const visibleCount = Math.min(filledCount + 1, MAX_SLOTS);

  const slots: PhotoSlot[] = Array.from(
    { length: visibleCount },
    (_, i) => photos[i] ?? null,
  );

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
      {slots.map((slot, index) => {
        const isRequired = index < REQUIRED_COUNT;

        if (slot) {
          const isSelected = selectedIndex === index;
          return (
            <TouchableOpacity
              key={slot.id}
              activeOpacity={0.85}
              onPress={() => handlePhotoPress(index)}
              style={{
                width: slotSize,
                height: slotSize,
                borderRadius: 12,
                overflow: "hidden",
                borderWidth: isSelected ? 3 : 0,
                borderColor: isSelected ? COLORS.primary[500] : "transparent",
              }}
            >
              <Image
                source={{ uri: slot.uri }}
                style={{ width: "100%", height: "100%", borderRadius: 12 }}
              />
              {/* Remove button */}
              <TouchableOpacity
                onPress={() => onRemove(index)}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  borderRadius: 12,
                  width: 24,
                  height: 24,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={14} color={COLORS.white} />
              </TouchableOpacity>
              {/* Profile badge on first slot */}
              {index === 0 && (
                <View
                  style={{
                    position: "absolute",
                    bottom: 6,
                    alignSelf: "center",
                    backgroundColor: COLORS.primary[600],
                    borderRadius: 9999,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 11, color: COLORS.white, fontWeight: "600" }}>
                    Profile
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }

        // Empty slot — next one to fill
        return (
          <TouchableOpacity
            key={index}
            onPress={() => onAdd(index)}
            activeOpacity={0.7}
            style={{
              width: slotSize,
              height: slotSize,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1.5,
              borderStyle: isRequired ? "solid" : "dashed",
              borderColor: COLORS.gray[300],
            }}
          >
            <Ionicons name="add" size={28} color={COLORS.gray[400]} />
            {isRequired && (
              <Text style={{ fontSize: 13, color: COLORS.gray[400], marginTop: 4 }}>
                Required
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
