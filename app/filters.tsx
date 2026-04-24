import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  FILTER_LABELS,
  FILTER_VALUE_LABELS,
} from "@/constants/filter-options";
import { COLORS } from "@/lib/constants";
import type { FilterCategory } from "@/types/filters";
import { countActiveFilters } from "@/types/filters";
import {
  useFilterDraft,
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
  cleanliness: "water-outline",
  noise_level: "volume-medium-outline",
  smoking: "flame-outline",
  partying: "wine-outline",
  guests: "people-outline",
  pets: "paw-outline",
  social_energy: "happy-outline",
  rushing: "school-outline",
  study_habits: "book-outline",
  budget_range: "cash-outline",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function summarize(category: FilterCategory, values: readonly string[]): string {
  if (values.length === 0) return "Any";
  const labels = values.map((v) => FILTER_VALUE_LABELS[category][v] ?? v);
  if (labels.length <= 2) return labels.join(", ");
  return `${labels[0]}, +${labels.length - 1}`;
}

// ---------------------------------------------------------------------------
// FilterRow
// ---------------------------------------------------------------------------

type FilterRowProps = {
  readonly category: FilterCategory;
  readonly selectedValues: readonly string[];
  readonly onPress: () => void;
};

function FilterRow({ category, selectedValues, onPress }: FilterRowProps) {
  const hasSelection = selectedValues.length > 0;
  const summary = summarize(category, selectedValues);
  const iconName = CATEGORY_ICONS[category] as keyof typeof Ionicons.glyphMap;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${FILTER_LABELS[category]}, ${summary}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.iconContainer,
            hasSelection && styles.iconContainerActive,
          ]}
        >
          <Ionicons
            name={iconName}
            size={17}
            color={hasSelection ? "#fff" : COLORS.gray[500]}
          />
        </View>
        <Text style={styles.rowLabel}>{FILTER_LABELS[category]}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text
          style={[styles.rowValue, hasSelection && styles.rowValueActive]}
          numberOfLines={1}
        >
          {summary}
        </Text>
        <Ionicons name="chevron-forward" size={15} color="#C7C7CC" />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function FiltersScreen() {
  const router = useRouter();
  const { draft } = useFilterDraft();
  const activeCount = useMemo(() => countActiveFilters(draft), [draft]);

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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Custom header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          style={styles.headerSide}
          accessibilityRole="button"
          accessibilityLabel="Close filters"
        >
          <Ionicons name="close" size={24} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.headerTitle}>Filters</Text>
        <Pressable
          onPress={handleClearAll}
          style={styles.headerSide}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          disabled={activeCount === 0}
        >
          <Text
            style={[
              styles.clearText,
              activeCount === 0 && styles.clearTextDisabled,
            ]}
          >
            Clear all
          </Text>
        </Pressable>
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
            <Text style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </Text>
            <View style={styles.sectionCard}>
              {section.categories.map((category, idx) => (
                <View key={category}>
                  {idx > 0 && <View style={styles.separator} />}
                  <FilterRow
                    category={category}
                    selectedValues={draft[category] ?? []}
                    onPress={() =>
                      router.push(
                        `/filter-category?category=${category}` as never,
                      )
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleApply}
          accessibilityRole="button"
          accessibilityLabel={
            activeCount > 0
              ? `Show results, ${activeCount} filter${activeCount === 1 ? "" : "s"} active`
              : "Show results"
          }
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.applyButtonPressed,
          ]}
        >
          <Text style={styles.applyButtonText}>
            {activeCount > 0 ? `Show results (${activeCount})` : "Show results"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  headerSide: {
    minWidth: 70,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C1C1E",
    letterSpacing: -0.2,
  },
  clearText: {
    fontSize: 15,
    color: COLORS.primary[600],
    fontWeight: "500",
    textAlign: "right",
  },
  clearTextDisabled: {
    color: "#C7C7CC",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionGap: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8E8E93",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5EA",
    marginLeft: 60,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    minHeight: 54,
    backgroundColor: "#fff",
  },
  rowPressed: {
    backgroundColor: "#F9F9F9",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainerActive: {
    backgroundColor: COLORS.primary[600],
  },
  rowLabel: {
    fontSize: 15,
    color: "#1C1C1E",
    fontWeight: "400",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "45%",
  },
  rowValue: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "right",
    flexShrink: 1,
  },
  rowValueActive: {
    color: COLORS.primary[600],
    fontWeight: "500",
  },
  bottomPad: {
    height: 24,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#F2F2F7",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
  },
  applyButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonPressed: {
    opacity: 0.85,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
