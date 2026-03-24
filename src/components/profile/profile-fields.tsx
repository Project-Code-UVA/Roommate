/**
 * Editable profile fields — bio, gender, hometown, year.
 *
 * Inline editing with save on blur/submit.
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

  const renderField = (
    label: string,
    field: string,
    value: string | null,
    icon: keyof typeof Ionicons.glyphMap,
    multiline = false,
  ) => {
    const isEditing = editingField === field;

    return (
      <View style={styles.fieldCard} key={field}>
        <View style={styles.fieldHeader}>
          <Ionicons name={icon} size={18} color={COLORS.primary[500]} />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>

        {isEditing ? (
          <View style={styles.editRow}>
            <TextInput
              style={[styles.input, multiline && styles.inputMultiline]}
              value={editValue}
              onChangeText={setEditValue}
              onSubmitEditing={() => saveEdit(field)}
              onBlur={() => saveEdit(field)}
              autoFocus
              multiline={multiline}
              maxLength={field === "bio" ? 500 : 100}
              placeholder={`Enter your ${label.toLowerCase()}`}
              placeholderTextColor={COLORS.gray[400]}
            />
          </View>
        ) : (
          <Pressable onPress={() => startEdit(field, value)} style={styles.valueRow}>
            <Text style={value ? styles.valueText : styles.placeholderText}>
              {value || `Add your ${label.toLowerCase()}`}
            </Text>
            <Ionicons name="pencil-outline" size={16} color={COLORS.gray[400]} />
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderField("Bio", "bio", bio, "chatbubble-outline", true)}
      {renderField("Year", "year", year, "school-outline")}

      {/* Gender with visibility toggle */}
      <View style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          <Ionicons name="person-outline" size={18} color={COLORS.primary[500]} />
          <Text style={styles.fieldLabel}>Gender</Text>
        </View>
        {editingField === "gender" ? (
          <TextInput
            style={styles.input}
            value={editValue}
            onChangeText={setEditValue}
            onSubmitEditing={() => saveEdit("gender")}
            onBlur={() => saveEdit("gender")}
            autoFocus
            maxLength={50}
            placeholder="Enter your gender"
            placeholderTextColor={COLORS.gray[400]}
          />
        ) : (
          <Pressable onPress={() => startEdit("gender", gender)} style={styles.valueRow}>
            <Text style={gender ? styles.valueText : styles.placeholderText}>
              {gender || "Add your gender"}
            </Text>
            <Ionicons name="pencil-outline" size={16} color={COLORS.gray[400]} />
          </Pressable>
        )}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show on profile</Text>
          <Switch
            value={showGender}
            onValueChange={(val) => { onUpdate({ show_gender: val }); }}
            trackColor={{ true: COLORS.primary[400], false: COLORS.gray[200] }}
          />
        </View>
      </View>

      {/* Hometown with visibility toggle */}
      <View style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          <Ionicons name="location-outline" size={18} color={COLORS.primary[500]} />
          <Text style={styles.fieldLabel}>Hometown</Text>
        </View>
        {editingField === "hometown" ? (
          <TextInput
            style={styles.input}
            value={editValue}
            onChangeText={setEditValue}
            onSubmitEditing={() => saveEdit("hometown")}
            onBlur={() => saveEdit("hometown")}
            autoFocus
            maxLength={100}
            placeholder="Enter your hometown"
            placeholderTextColor={COLORS.gray[400]}
          />
        ) : (
          <Pressable onPress={() => startEdit("hometown", hometown)} style={styles.valueRow}>
            <Text style={hometown ? styles.valueText : styles.placeholderText}>
              {hometown || "Add your hometown"}
            </Text>
            <Ionicons name="pencil-outline" size={16} color={COLORS.gray[400]} />
          </Pressable>
        )}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show on profile</Text>
          <Switch
            value={showHometown}
            onValueChange={(val) => { onUpdate({ show_hometown: val } as ProfileUpdate); }}
            trackColor={{ true: COLORS.primary[400], false: COLORS.gray[200] }}
          />
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
    gap: 12,
  },
  fieldCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[500],
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueText: {
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.gray[400],
    fontStyle: "italic",
    flex: 1,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary[400],
    paddingVertical: 4,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
  },
  toggleLabel: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
});
