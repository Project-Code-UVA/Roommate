/**
 * Shared multi-select editor for roommate preferences.
 *
 * Renders one section per filter category with toggleable chips. Used in both
 * onboarding and settings so the option lists stay in sync across flows.
 */

import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import {
  FILTER_CATEGORY_ORDER,
  FILTER_LABELS,
  FILTER_OPTIONS,
  FILTER_VALUE_LABELS,
} from "@/constants/filter-options";
import { OnboardingProgressBar } from "@/components/onboarding/progress-bar";
import type { FilterCategory } from "@/types/filters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MultiSelections = Partial<Record<FilterCategory, readonly string[]>>;

const CATEGORY_ICONS: Record<FilterCategory, string> = {
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

type Props = {
  readonly title: string;
  readonly subtitle: string;
  readonly initial: MultiSelections;
  readonly actionLabel: string;
  readonly skipLabel?: string;
  readonly progress?: { readonly current: number; readonly total: number };
  readonly onBack?: () => void;
  readonly onSave: (selections: MultiSelections) => Promise<void> | void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toggleValue(
  selections: MultiSelections,
  category: FilterCategory,
  value: string,
): MultiSelections {
  const current = selections[category] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  if (next.length === 0) {
    const { [category]: _removed, ...rest } = selections;
    return rest;
  }
  return { ...selections, [category]: next };
}

function countSelected(selections: MultiSelections): number {
  let total = 0;
  for (const key of Object.keys(selections) as FilterCategory[]) {
    total += selections[key]?.length ?? 0;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NittyGrittyMultiEditor({
  title,
  subtitle,
  initial,
  actionLabel,
  skipLabel,
  progress,
  onBack,
  onSave,
}: Props) {
  const [selections, setSelections] = useState<MultiSelections>(initial);
  const [saving, setSaving] = useState(false);

  const accent = ACCENT_PRIMARY;
  const selectedCount = countSelected(selections);

  const handleToggle = useCallback((category: FilterCategory, value: string) => {
    setSelections((prev) => toggleValue(prev, category, value));
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(selections);
    } finally {
      setSaving(false);
    }
  }, [saving, selections, onSave]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar: back + progress */}
      <View style={styles.topBar}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.gray[800]} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        {progress ? (
          <OnboardingProgressBar
            currentStep={progress.current}
            totalSteps={progress.total}
            fillColor={accent.bar}
          />
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>

      {/* Title */}
      <View style={styles.titleArea}>
        <Text style={[styles.title, { color: accent.title }]}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Categories */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {FILTER_CATEGORY_ORDER.map((category) => {
          const selected = selections[category] ?? [];
          return (
            <View key={category} style={styles.categoryBlock}>
              <View style={styles.categoryHeader}>
                <Ionicons
                  name={CATEGORY_ICONS[category] as "moon-outline"}
                  size={16}
                  color={accent.icon}
                  style={styles.categoryIcon}
                />
                <Text style={styles.categoryLabel}>{FILTER_LABELS[category]}</Text>
              </View>
              <View style={styles.chipRow}>
                {FILTER_OPTIONS[category].map((value) => {
                  const isSelected = selected.includes(value);
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => handleToggle(category, value)}
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected && {
                          backgroundColor: accent.chipBg,
                          borderColor: accent.chipBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && { color: accent.chipText },
                        ]}
                      >
                        {FILTER_VALUE_LABELS[category][value]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {selectedCount > 0 && (
          <Text style={styles.selectedCount}>
            {selectedCount} selected
          </Text>
        )}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
          style={[styles.button, { backgroundColor: accent.button }]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {selectedCount === 0 && skipLabel ? skipLabel : actionLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Accent palette
// ---------------------------------------------------------------------------

const ACCENT_PRIMARY = {
  title: COLORS.gray[900],
  icon: COLORS.primary[500],
  bar: COLORS.primary[600],
  button: COLORS.primary[600],
  chipBg: COLORS.primary[600],
  chipBorder: COLORS.primary[600],
  chipText: "#fff",
} as const;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: { width: 28 },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 9999 },
  titleArea: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: "700" },
  subtitle: { fontSize: 18, color: COLORS.gray[500], marginTop: 8 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  categoryBlock: { marginBottom: 24 },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryIcon: { marginRight: 6 },
  categoryLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, fontWeight: "500", color: COLORS.gray[700] },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 8,
  },
  selectedCount: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: "center",
  },
  button: { borderRadius: 9999, paddingVertical: 18 },
  buttonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
