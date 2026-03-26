/**
 * Mode selector — roommate / friends / found-roommate picker.
 *
 * Used standalone on the Your Status sub-page.
 * PRD: "found_roommate" removes user from Discovery.
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
    description: "Appear in Discovery to meet new people",
    icon: "people-outline",
  },
  {
    value: "found_roommate",
    label: "Found my roommate!",
    description: "Hide from Discovery — you can change this later",
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
      <Text style={styles.hint}>Choose how you appear in Discovery</Text>
      <View style={styles.options}>
        {MODES.map((mode, index) => {
          const isActive = currentMode === mode.value;
          const isLast = index === MODES.length - 1;
          return (
            <View key={mode.value}>
              <Pressable
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => handleSelect(mode.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                  <Ionicons
                    name={mode.icon}
                    size={20}
                    color={isActive ? "#fff" : COLORS.gray[400]}
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {mode.label}
                  </Text>
                  <Text style={styles.optionDesc}>{mode.description}</Text>
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.primary[600]} />
                )}
              </Pressable>
              {!isLast && <View style={styles.separator} />}
            </View>
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
  container: {},
  hint: {
    fontSize: 13,
    color: COLORS.gray[400],
    marginBottom: 12,
    marginLeft: 2,
  },
  options: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.gray[200],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
    marginLeft: 64,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionActive: {
    backgroundColor: COLORS.primary[50],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: COLORS.primary[600],
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray[800],
  },
  optionLabelActive: {
    color: COLORS.primary[700],
  },
  optionDesc: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 1,
  },
});
