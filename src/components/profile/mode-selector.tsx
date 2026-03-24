/**
 * Mode selector — roommate / friends / found-roommate picker.
 *
 * PRD: Setting to "found_roommate" removes user from Discovery stack.
 */

import { useCallback } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
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
  readonly description: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODES: readonly ModeOption[] = [
  {
    value: "roommate",
    label: "Looking for roommate",
    description: "Appear in Discovery for roommate matching",
    icon: "home-outline",
  },
  {
    value: "friends",
    label: "Looking for friends",
    description: "Appear in Discovery for friend matching",
    icon: "people-outline",
  },
  {
    value: "found_roommate",
    label: "Found my roommate!",
    description: "Hide from Discovery (you can change this later)",
    icon: "checkmark-circle-outline",
  },
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
      <Text style={styles.title}>Your Status</Text>
      <View style={styles.options}>
        {MODES.map((mode) => {
          const isActive = currentMode === mode.value;
          return (
            <Pressable
              key={mode.value}
              style={[styles.option, isActive && styles.optionActive]}
              onPress={() => handleSelect(mode.value)}
            >
              <Ionicons
                name={mode.icon}
                size={24}
                color={isActive ? COLORS.primary[600] : COLORS.gray[400]}
              />
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                  {mode.label}
                </Text>
                <Text style={styles.optionDesc}>{mode.description}</Text>
              </View>
              {isActive && (
                <Ionicons name="checkmark-circle" size={22} color={COLORS.primary[600]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  options: {
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  optionActive: {
    borderColor: COLORS.primary[400],
    backgroundColor: COLORS.primary[50],
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  optionLabelActive: {
    color: COLORS.primary[700],
  },
  optionDesc: {
    fontSize: 13,
    color: COLORS.gray[500],
    marginTop: 2,
  },
});
