/**
 * Editable profile fields — directory/settings style.
 *
 * Grouped rows inside rounded cards. Tap a row to edit inline.
 * Visibility toggles are shown inline on gender and hometown rows.
 */

import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Switch,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import type { ProfileUpdate } from "@/services/profile-service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProfileFieldsProps = {
  readonly bio: string | null;
  readonly gender: string | null;
  readonly showGender: boolean;
  readonly hometown: string | null;
  readonly showHometown: boolean;
  readonly year: string | null;
  readonly onUpdate: (fields: ProfileUpdate) => Promise<{ error: string | null }>;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function Separator() {
  return <View style={styles.separator} />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileFields({
  bio,
  gender,
  showGender,
  hometown,
  showHometown,
  year,
  onUpdate,
}: ProfileFieldsProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEdit = useCallback((field: string, currentValue: string | null) => {
    setEditingField(field);
    setEditValue(currentValue ?? "");
  }, []);

  const saveEdit = useCallback(
    async (field: string) => {
      setEditingField(null);
      await onUpdate({ [field]: editValue || null });
    },
    [editValue, onUpdate],
  );

  return (
    <View style={styles.container}>
      {/* ── ABOUT ── */}
      <SectionHeader title="ABOUT" />
      <View style={styles.group}>
        {/* Bio */}
        <Pressable
          style={styles.row}
          onPress={() => editingField !== "bio" && startEdit("bio", bio)}
        >
          <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary[500]} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Bio</Text>
          {editingField === "bio" ? (
            <TextInput
              style={[styles.inlineInput, styles.inlineInputMultiline]}
              value={editValue}
              onChangeText={setEditValue}
              onBlur={() => saveEdit("bio")}
              autoFocus
              multiline
              maxLength={500}
              placeholder="Tell roommates about yourself"
              placeholderTextColor={COLORS.gray[400]}
            />
          ) : (
            <View style={styles.rowRight}>
              <Text
                style={bio ? styles.rowValue : styles.rowPlaceholder}
                numberOfLines={2}
              >
                {bio ?? "Add your bio"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray[300]} />
            </View>
          )}
        </Pressable>

        <Separator />

        {/* Year */}
        <Pressable
          style={styles.row}
          onPress={() => editingField !== "year" && startEdit("year", year)}
        >
          <Ionicons name="school-outline" size={16} color={COLORS.primary[500]} style={styles.rowIcon} />
          <Text style={styles.rowLabel}>Grad year</Text>
          {editingField === "year" ? (
            <TextInput
              style={styles.inlineInput}
              value={editValue}
              onChangeText={setEditValue}
              onSubmitEditing={() => saveEdit("year")}
              onBlur={() => saveEdit("year")}
              autoFocus
              keyboardType="number-pad"
              maxLength={4}
              placeholder="e.g. 2026"
              placeholderTextColor={COLORS.gray[400]}
            />
          ) : (
            <View style={styles.rowRight}>
              <Text style={year ? styles.rowValue : styles.rowPlaceholder}>
                {year ?? "Add"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gray[300]} />
            </View>
          )}
        </Pressable>
      </View>

      {/* ── DETAILS ── */}
      <SectionHeader title="DETAILS" />
      <View style={styles.group}>
        {/* Gender */}
        <View>
          <Pressable
            style={styles.row}
            onPress={() => editingField !== "gender" && startEdit("gender", gender)}
          >
            <Ionicons name="person-outline" size={16} color={COLORS.primary[500]} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Gender</Text>
            {editingField === "gender" ? (
              <TextInput
                style={styles.inlineInput}
                value={editValue}
                onChangeText={setEditValue}
                onSubmitEditing={() => saveEdit("gender")}
                onBlur={() => saveEdit("gender")}
                autoFocus
                maxLength={50}
                placeholder="Your gender"
                placeholderTextColor={COLORS.gray[400]}
              />
            ) : (
              <View style={styles.rowRight}>
                <Text style={gender ? styles.rowValue : styles.rowPlaceholder}>
                  {gender ?? "Add"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray[300]} />
              </View>
            )}
          </Pressable>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Visible on profile</Text>
            <Switch
              value={showGender}
              onValueChange={(val) => onUpdate({ show_gender: val })}
              trackColor={{ true: COLORS.primary[400], false: COLORS.gray[200] }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Separator />

        {/* Hometown */}
        <View>
          <Pressable
            style={styles.row}
            onPress={() => editingField !== "hometown" && startEdit("hometown", hometown)}
          >
            <Ionicons name="location-outline" size={16} color={COLORS.primary[500]} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>Hometown</Text>
            {editingField === "hometown" ? (
              <TextInput
                style={styles.inlineInput}
                value={editValue}
                onChangeText={setEditValue}
                onSubmitEditing={() => saveEdit("hometown")}
                onBlur={() => saveEdit("hometown")}
                autoFocus
                maxLength={100}
                placeholder="Your hometown"
                placeholderTextColor={COLORS.gray[400]}
              />
            ) : (
              <View style={styles.rowRight}>
                <Text style={hometown ? styles.rowValue : styles.rowPlaceholder}>
                  {hometown ?? "Add"}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray[300]} />
              </View>
            )}
          </Pressable>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Visible on profile</Text>
            <Switch
              value={showHometown}
              onValueChange={(val) => onUpdate({ show_hometown: val } as ProfileUpdate)}
              trackColor={{ true: COLORS.primary[400], false: COLORS.gray[200] }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray[400],
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 20,
    marginLeft: 4,
  },
  group: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.gray[200],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[200],
    marginLeft: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowIcon: {
    marginRight: 10,
    width: 18,
    textAlign: "center",
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.gray[800],
    width: 80,
  },
  rowRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  rowValue: {
    fontSize: 15,
    color: COLORS.gray[500],
    textAlign: "right",
    flex: 1,
  },
  rowPlaceholder: {
    fontSize: 15,
    color: COLORS.gray[300],
    textAlign: "right",
    flex: 1,
  },
  inlineInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[800],
    textAlign: "right",
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primary[400],
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  inlineInputMultiline: {
    textAlign: "left",
    minHeight: 48,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 0,
    marginLeft: 28,
  },
  toggleLabel: {
    fontSize: 13,
    color: COLORS.gray[400],
  },
});
