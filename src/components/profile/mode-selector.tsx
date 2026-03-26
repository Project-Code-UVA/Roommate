/**
 * Mode selector — roommate / friends / found-roommate picker.
 *
 * Compact horizontal chip row. PRD: "found_roommate" removes user from Discovery.
 */

import { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { COLORS } from "@/lib/constants";
import { updateModeStatus } from "@/services/discovery-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModeStatus = "roommate" | "friends" | "found_roommate";

type ModeSelectorProps = {
  readonly userId: string;
  readonly currentMode: ModeStatus;
  readonly onModeChange: (mode: ModeStatus) => void;
};

type ModeOption = {
  readonly value: ModeStatus;
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODES: readonly ModeOption[] = [
  { value: "roommate", label: "Roommate", icon: "home-outline" },
  { value: "friends", label: "Friends", icon: "people-outline" },
  { value: "found_roommate", label: "Found one!", icon: "checkmark-circle-outline" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModeSelector({ userId, currentMode, onModeChange }: ModeSelectorProps) {
  const handleSelect = useCallback(
    (mode: ModeStatus) => {
      if (mode === currentMode) return;

      const apply = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onModeChange(mode);
        await updateModeStatus(userId, mode);
      };

      if (mode === "found_roommate") {
        Alert.alert(
          "Hide from Discovery?",
          "You won't appear in anyone's Discovery feed. You can change this later.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", onPress: apply },
          ],
        );
      } else {
        apply();
      }
    },
    [currentMode, userId, onModeChange],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>YOUR STATUS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {MODES.map((mode) => {
          const isActive = currentMode === mode.value;
          return (
            <Pressable
              key={mode.value}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handleSelect(mode.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Ionicons
                name={mode.icon}
                size={15}
                color={isActive ? "#fff" : COLORS.gray[500]}
              />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray[400],
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    backgroundColor: "#fff",
  },
  chipActive: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  chipTextActive: {
    color: "#fff",
  },
});
