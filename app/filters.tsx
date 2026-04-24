import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  FILTER_OPTIONS,
  FILTER_LABELS,
  FILTER_VALUE_LABELS,
} from "@/constants/filter-options";
import { COLORS } from "@/lib/constants";
import type { DiscoveryFilters, FilterCategory } from "@/types/filters";
import { countActiveFilters } from "@/types/filters";
import {
  useFilterDraft,
  updateFilterDraft,
  clearFilterDraft,
  applyFilterDraft,
} from "@/stores/filter-draft";

// ---------------------------------------------------------------------------
// Section definitions
// ---------------------------------------------------------------------------

type FilterSection = {
  readonly title: string;
  readonly categories: readonly FilterCategory[];
};

const SECTIONS: readonly FilterSection[] = [
  {
    title: "Lifestyle",
    categories: [
      "sleep_schedule",
      "cleanliness",
      "noise_level",
      "smoking",
      "partying",
    ],
  },
  {
    title: "Social",
    categories: ["guests", "pets", "social_energy"],
  },
  {
    title: "Campus",
    categories: ["rushing", "study_habits"],
  },
  {
    title: "Budget",
    categories: ["budget_range"],
  },
];

const CATEGORY_ICONS: Readonly<Record<FilterCategory, string>> = {
  sleep_schedule: "moon-outline",
  cleanliness: "sparkles-outline",
  noise_level: "volume-medium-outline",
  smoking: "flame-outline",
  partying: "musical-notes-outline",
  guests: "people-outline",
  pets: "paw-outline",
  social_energy: "people-circle-outline",
  rushing: "ribbon-outline",
  study_habits: "book-outline",
  budget_range: "cash-outline",
};

// ---------------------------------------------------------------------------
// Pure helper (immutable) — toggles one value on/off for a category
// ---------------------------------------------------------------------------

function toggleValue(
  filters: DiscoveryFilters,
  category: FilterCategory,
  value: string,
): DiscoveryFilters {
  const current = filters[category] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  if (next.length === 0) {
    const copy: Record<string, readonly string[]> = { ...filters };
    delete copy[category];
    return copy as DiscoveryFilters;
  }

  return { ...filters, [category]: next };
}

// ---------------------------------------------------------------------------
// CategoryBlock — icon + label + chip row
// ---------------------------------------------------------------------------

type CategoryBlockProps = {
  readonly category: FilterCategory;
  readonly selected: readonly string[];
  readonly onToggle: (value: string) => void;
};

function CategoryBlock({ category, selected, onToggle }: CategoryBlockProps) {
  const icon = CATEGORY_ICONS[category] as keyof typeof Ionicons.glyphMap;
  const options = FILTER_OPTIONS[category];

  return (
    <View style={styles.categoryBlock}>
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
        {options.map((value) => {
          const isSelected = selected.includes(value);
          return (
            <TouchableOpacity
              key={value}
              onPress={() => onToggle(value)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={[styles.chip, isSelected && styles.chipSelected]}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
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
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function FiltersScreen() {
  const router = useRouter();
  const { draft } = useFilterDraft();
  const activeCount = useMemo(() => countActiveFilters(draft), [draft]);

  const handleToggle = useCallback(
    (category: FilterCategory, value: string) => {
      updateFilterDraft(toggleValue(draft, category, value));
    },
    [draft],
  );

  const handleApply = useCallback(() => {
    applyFilterDraft();
    router.back();
  }, [router]);

  const handleClearAll = useCallback(() => {
    clearFilterDraft();
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar: close + clear all */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close filters"
          hitSlop={8}
        >
          <Ionicons name="close" size={28} color={COLORS.gray[800]} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClearAll}
          disabled={activeCount === 0}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          hitSlop={8}
        >
          <Text
            style={[
              styles.clearText,
              activeCount === 0 && styles.clearTextDisabled,
            ]}
          >
            Clear all
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero title */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>Filters</Text>
        <Text style={styles.subtitle}>
          Fine-tune who you see on Discovery and Explore.
        </Text>
      </View>

      {/* Sections */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section, sectionIdx) => (
          <View
            key={section.title}
            style={sectionIdx > 0 ? styles.sectionGap : undefined}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.categories.map((category) => (
              <CategoryBlock
                key={category}
                category={category}
                selected={draft[category] ?? []}
                onToggle={(value) => handleToggle(category, value)}
              />
            ))}
          </View>
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {activeCount > 0 && (
          <Text style={styles.activeCount}>
            {activeCount} {activeCount === 1 ? "filter" : "filters"} applied
          </Text>
        )}
        <TouchableOpacity
          onPress={handleApply}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={
            activeCount > 0
              ? `Show results, ${activeCount} filter${activeCount === 1 ? "" : "s"} active`
              : "Show results"
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {activeCount > 0 ? `Show results (${activeCount})` : "Show results"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary[600],
  },
  clearTextDisabled: {
    color: COLORS.gray[300],
  },
  titleArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    color: COLORS.gray[900],
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 6,
    lineHeight: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  sectionGap: {
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.gray[500],
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  categoryBlock: {
    marginBottom: 22,
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
  bottomPad: {
    height: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
    gap: 8,
  },
  activeCount: {
    fontSize: 13,
    color: COLORS.gray[500],
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 9999,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
