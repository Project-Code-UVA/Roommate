/**
 * Editable profile fields — onboarding-style, modern and thematic.
 *
 * - Bio / Grad year / Gender / Hometown: labeled inputs, save on blur.
 * - Gender & Hometown include an inline Visibility pill (eye icon toggle).
 * - Lifestyle: inline chip rows per category, single-select, mirrors the
 *   onboarding `nitty-gritty` screen for consistency.
 */

import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import {
  FILTER_CATEGORY_ORDER,
  FILTER_LABELS,
  FILTER_OPTIONS,
  FILTER_VALUE_LABELS,
} from "@/constants/filter-options";
import type { ProfileUpdate } from "@/services/profile-service";
import type { Json } from "@/types/database.types";
import type { FilterCategory, NittyGritty } from "@/types/filters";

// ---------------------------------------------------------------------------
// Lifestyle categories shown on the edit profile screen.
// Smoking + budget_range are filtering-only; they aren't displayed as
// self-identifiers on the profile.
// ---------------------------------------------------------------------------

const LIFESTYLE_CATEGORIES: readonly FilterCategory[] = FILTER_CATEGORY_ORDER.filter(
  (c) => c !== "smoking" && c !== "budget_range",
);

const LIFESTYLE_ICONS: Readonly<Record<FilterCategory, string>> = {
  sleep_schedule: "moon-outline",
  cleanliness: "sparkles-outline",
  noise_level: "volume-medium-outline",
  guests: "people-outline",
  pets: "paw-outline",
  smoking: "flame-outline",
  partying: "musical-notes-outline",
  study_habits: "book-outline",
  budget_range: "cash-outline",
  rushing: "ribbon-outline",
  social_energy: "people-circle-outline",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type ProfileFieldsProps = {
  readonly bio: string | null;
  readonly gender: string | null;
  readonly showGender: boolean;
  readonly hometown: string | null;
  readonly showHometown: boolean;
  readonly year: string | null;
  readonly nittyGritty: NittyGritty | null;
  readonly onUpdate: (fields: ProfileUpdate) => Promise<{ error: string | null }>;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

type VisibilityPillProps = {
  readonly value: boolean;
  readonly onToggle: (next: boolean) => void;
};

function VisibilityPill({ value, onToggle }: VisibilityPillProps) {
  return (
    <TouchableOpacity
      onPress={() => onToggle(!value)}
      activeOpacity={0.7}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={value ? "Visible on profile" : "Hidden from profile"}
      style={[styles.visibilityPill, value ? styles.visibilityPillOn : styles.visibilityPillOff]}
    >
      <Ionicons
        name={value ? "eye-outline" : "eye-off-outline"}
        size={14}
        color={value ? COLORS.primary[600] : COLORS.gray[500]}
      />
      <Text style={[styles.visibilityPillText, value ? styles.visibilityPillTextOn : styles.visibilityPillTextOff]}>
        {value ? "Visible on profile" : "Hidden from profile"}
      </Text>
    </TouchableOpacity>
  );
}

type LabeledInputProps = {
  readonly label: string;
  readonly value: string;
  readonly placeholder: string;
  readonly onChangeText: (v: string) => void;
  readonly onCommit: () => void;
  readonly multiline?: boolean;
  readonly maxLength?: number;
  readonly keyboardType?: "default" | "number-pad";
  readonly showCounter?: boolean;
};

function LabeledInput({
  label,
  value,
  placeholder,
  onChangeText,
  onCommit,
  multiline = false,
  maxLength,
  keyboardType = "default",
  showCounter = false,
}: LabeledInputProps) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {showCounter && maxLength ? (
          <Text style={styles.counter}>
            {value.length}/{maxLength}
          </Text>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        onEndEditing={onCommit}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray[400]}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        returnKeyType={multiline ? "default" : "done"}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
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
  nittyGritty,
  onUpdate,
}: ProfileFieldsProps) {
  // Local editable copies — sync back to server on field blur.
  const [bioDraft, setBioDraft] = useState(bio ?? "");
  const [yearDraft, setYearDraft] = useState(year ?? "");
  const [genderDraft, setGenderDraft] = useState(gender ?? "");
  const [hometownDraft, setHometownDraft] = useState(hometown ?? "");

  // Re-sync drafts if the parent profile changes underneath us (e.g. remote refresh).
  useEffect(() => setBioDraft(bio ?? ""), [bio]);
  useEffect(() => setYearDraft(year ?? ""), [year]);
  useEffect(() => setGenderDraft(gender ?? ""), [gender]);
  useEffect(() => setHometownDraft(hometown ?? ""), [hometown]);

  const commit = useCallback(
    (field: keyof ProfileUpdate, next: string, current: string | null) => {
      const normalized = next.trim() === "" ? null : next.trim();
      if (normalized === (current ?? null)) return;
      void onUpdate({ [field]: normalized } as ProfileUpdate);
    },
    [onUpdate],
  );

  const toggleVisibility = useCallback(
    (field: "show_gender" | "show_hometown", next: boolean) => {
      void onUpdate({ [field]: next } as ProfileUpdate);
    },
    [onUpdate],
  );

  const pickLifestyle = useCallback(
    (category: FilterCategory, value: string) => {
      const existingSelf = nittyGritty?.self ?? {};
      const currentValue = existingSelf[category];
      // Tap same chip to deselect; otherwise replace.
      const nextSelf: Record<string, string> = { ...existingSelf };
      if (currentValue === value) {
        delete nextSelf[category];
      } else {
        nextSelf[category] = value;
      }
      void onUpdate({
        nitty_gritty: {
          self: nextSelf,
          preferences: nittyGritty?.preferences ?? {},
        } as unknown as Json,
      });
    },
    [nittyGritty, onUpdate],
  );

  return (
    <View style={styles.container}>
      {/* ── ABOUT ── */}
      <SectionHeader title="About" />
      <LabeledInput
        label="Bio"
        value={bioDraft}
        placeholder="Tell roommates about yourself"
        onChangeText={setBioDraft}
        onCommit={() => commit("bio", bioDraft, bio)}
        multiline
        maxLength={500}
        showCounter
      />
      <LabeledInput
        label="Grad year"
        value={yearDraft}
        placeholder="e.g. 2027"
        onChangeText={setYearDraft}
        onCommit={() => commit("year", yearDraft, year)}
        keyboardType="number-pad"
        maxLength={4}
      />

      {/* ── DETAILS ── */}
      <SectionHeader title="Details" />
      <LabeledInput
        label="Gender"
        value={genderDraft}
        placeholder="Your gender"
        onChangeText={setGenderDraft}
        onCommit={() => commit("gender", genderDraft, gender)}
        maxLength={50}
      />
      <VisibilityPill value={showGender} onToggle={(next) => toggleVisibility("show_gender", next)} />

      <LabeledInput
        label="Hometown"
        value={hometownDraft}
        placeholder="Your hometown"
        onChangeText={setHometownDraft}
        onCommit={() => commit("hometown", hometownDraft, hometown)}
        maxLength={100}
      />
      <VisibilityPill value={showHometown} onToggle={(next) => toggleVisibility("show_hometown", next)} />

      {/* ── LIFESTYLE ── */}
      <SectionHeader title="Lifestyle" />
      <Text style={styles.sectionCaption}>
        Help future roommates know what it's like to live with you.
      </Text>
      {LIFESTYLE_CATEGORIES.map((category) => {
        const current = nittyGritty?.self?.[category];
        const icon = LIFESTYLE_ICONS[category] as keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
        return (
          <View key={category} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <Ionicons
                name={icon}
                size={16}
                color={COLORS.primary[500]}
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryLabel}>{FILTER_LABELS[category]}</Text>
            </View>
            <View style={styles.chipRow}>
              {FILTER_OPTIONS[category].map((value) => {
                const selected = current === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => pickLifestyle(category, value)}
                    activeOpacity={0.7}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {FILTER_VALUE_LABELS[category][value]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray[500],
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 28,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  sectionCaption: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginHorizontal: 4,
    marginBottom: 16,
    marginTop: -4,
    lineHeight: 20,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[600],
    letterSpacing: 0.2,
  },
  counter: {
    fontSize: 12,
    color: COLORS.gray[400],
    fontVariant: ["tabular-nums"],
  },
  input: {
    fontSize: 16,
    color: COLORS.gray[900],
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  visibilityPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    borderRadius: 9999,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: -8,
    marginBottom: 18,
    marginLeft: 4,
  },
  visibilityPillOn: {
    borderColor: COLORS.primary[300],
    backgroundColor: COLORS.primary[50],
  },
  visibilityPillOff: {
    borderColor: COLORS.gray[300],
    backgroundColor: "#fff",
  },
  visibilityPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  visibilityPillTextOn: {
    color: COLORS.primary[700],
  },
  visibilityPillTextOff: {
    color: COLORS.gray[600],
  },
  categoryBlock: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  chipSelected: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  chipText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray[700],
  },
  chipTextSelected: {
    color: "#fff",
  },
});
