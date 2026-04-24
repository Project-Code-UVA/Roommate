/**
 * FilterSheet — session-level Discovery/Explore filter UI.
 *
 * Shows the 9 nitty-gritty categories as expandable sections with multi-select
 * chips. Edits are buffered in local state and committed to the parent only
 * when the user taps "Apply". "Clear all" resets the buffer to empty.
 *
 * This filter is ad-hoc — it never writes to the user's saved profile
 * preferences. See DiscoveryFilters in src/types/filters.ts.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  FILTER_CATEGORY_ORDER,
  FILTER_LABELS,
  FILTER_OPTIONS,
  FILTER_VALUE_LABELS,
} from "@/constants/filter-options";
import { COLORS } from "@/lib/constants";
import type { DiscoveryFilters, FilterCategory } from "@/types/filters";
import { countActiveFilters, normalizeFilters } from "@/types/filters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FilterSheetProps = {
  readonly visible: boolean;
  readonly initialFilters: DiscoveryFilters;
  readonly onApply: (filters: DiscoveryFilters) => void;
  readonly onClose: () => void;
};

// ---------------------------------------------------------------------------
// Pure helpers (immutable)
// ---------------------------------------------------------------------------

function toggleValue(
  filters: DiscoveryFilters,
  category: FilterCategory,
  value: string,
): DiscoveryFilters {
  const current = filters[category] ?? [];
  const nextValues = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  if (nextValues.length === 0) {
    // Drop the key entirely when the list empties out.
    const copy: Record<string, readonly string[]> = { ...filters };
    delete copy[category];
    return copy as DiscoveryFilters;
  }

  return { ...filters, [category]: nextValues };
}

function clearCategory(
  filters: DiscoveryFilters,
  category: FilterCategory,
): DiscoveryFilters {
  if (!filters[category]) return filters;
  const copy: Record<string, readonly string[]> = { ...filters };
  delete copy[category];
  return copy as DiscoveryFilters;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FilterSheet({
  visible,
  initialFilters,
  onApply,
  onClose,
}: FilterSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [draft, setDraft] = useState<DiscoveryFilters>(initialFilters);
  const [expanded, setExpanded] = useState<FilterCategory | null>(null);

  // Reset draft whenever the sheet opens with a (possibly new) initial value.
  useEffect(() => {
    if (visible) {
      setDraft(initialFilters);
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, initialFilters]);

  const handleDismiss = useCallback(() => {
    setExpanded(null);
    onClose();
  }, [onClose]);

  const handleToggle = useCallback(
    (category: FilterCategory, value: string) => {
      setDraft((prev) => toggleValue(prev, category, value));
    },
    [],
  );

  const handleClearCategory = useCallback((category: FilterCategory) => {
    setDraft((prev) => clearCategory(prev, category));
  }, []);

  const handleClearAll = useCallback(() => {
    setDraft({});
  }, []);

  const handleApply = useCallback(() => {
    onApply(normalizeFilters(draft));
    onClose();
  }, [draft, onApply, onClose]);

  const handleToggleExpanded = useCallback((category: FilterCategory) => {
    setExpanded((prev) => (prev === category ? null : category));
  }, []);

  const activeCount = useMemo(() => countActiveFilters(draft), [draft]);

  if (!visible) return null;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["80%"]}
      onDismiss={handleDismiss}
      enablePanDownToClose
    >
      <View style={styles.header}>
        <Text style={styles.title}>Filters</Text>
        <Pressable
          onPress={handleClearAll}
          accessibilityRole="button"
          accessibilityLabel="Clear all filters"
          testID="filter-clear-all"
          disabled={activeCount === 0}
          style={({ pressed }) => [
            styles.clearAllButton,
            pressed && styles.pressed,
            activeCount === 0 && styles.disabled,
          ]}
        >
          <Text
            style={[
              styles.clearAllText,
              activeCount === 0 && styles.clearAllTextDisabled,
            ]}
          >
            Clear all
          </Text>
        </Pressable>
      </View>

      <BottomSheetScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {FILTER_CATEGORY_ORDER.map((category) => {
          const values = draft[category] ?? [];
          const count = values.length;
          const isOpen = expanded === category;

          return (
            <View key={category} style={styles.section}>
              <Pressable
                onPress={() => handleToggleExpanded(category)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                testID={`filter-section-${category}`}
                style={({ pressed }) => [
                  styles.sectionHeader,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.sectionTitle}>
                  {FILTER_LABELS[category]}
                </Text>

                <View style={styles.sectionRight}>
                  {count > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{count}</Text>
                    </View>
                  )}
                  {count > 0 && (
                    <Pressable
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handleClearCategory(category);
                      }}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Clear ${FILTER_LABELS[category]}`}
                      testID={`filter-clear-${category}`}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={COLORS.gray[400]}
                      />
                    </Pressable>
                  )}
                  <Ionicons
                    name={isOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={COLORS.gray[500]}
                  />
                </View>
              </Pressable>

              {isOpen && (
                <View style={styles.chipsContainer}>
                  {FILTER_OPTIONS[category].map((value) => {
                    const selected = values.includes(value);
                    const label =
                      FILTER_VALUE_LABELS[category][value] ?? value;
                    return (
                      <Pressable
                        key={value}
                        onPress={() => handleToggle(category, value)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={label}
                        testID={`filter-chip-${category}-${value}`}
                        style={({ pressed }) => [
                          styles.chip,
                          selected && styles.chipSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected && styles.chipTextSelected,
                          ]}
                        >
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Bottom spacing so content scrolls clear of the sticky footer */}
        <View style={styles.bottomSpacer} />
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleApply}
          accessibilityRole="button"
          accessibilityLabel="Apply filters"
          testID="filter-apply"
          style={({ pressed }) => [
            styles.applyButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.applyButtonText}>
            {activeCount > 0
              ? `Apply ${activeCount} filter${activeCount === 1 ? "" : "s"}`
              : "Apply"}
          </Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.gray[900],
    letterSpacing: -0.3,
  },
  clearAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary[600],
  },
  clearAllTextDisabled: {
    color: COLORS.gray[400],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.gray[900],
  },
  sectionRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: COLORS.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  chipSelected: {
    backgroundColor: COLORS.primary[600],
    borderColor: COLORS.primary[600],
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  chipTextSelected: {
    color: "#fff",
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.gray[200],
  },
  applyButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.5,
  },
});
