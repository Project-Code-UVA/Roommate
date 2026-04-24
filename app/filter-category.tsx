import { useCallback } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  FILTER_OPTIONS,
  FILTER_LABELS,
  FILTER_VALUE_LABELS,
} from "@/constants/filter-options";
import { COLORS } from "@/lib/constants";
import type { FilterCategory, DiscoveryFilters } from "@/types/filters";
import { useFilterDraft, updateFilterDraft } from "@/stores/filter-draft";

// ---------------------------------------------------------------------------
// Pure helper (immutable)
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
// Screen
// ---------------------------------------------------------------------------

export default function FilterCategoryScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { draft } = useFilterDraft();

  const cat = category as FilterCategory;
  const options = FILTER_OPTIONS[cat] ?? [];
  const selectedValues = (draft[cat] ?? []) as readonly string[];
  const title = FILTER_LABELS[cat] ?? category ?? "Filter";

  const handleToggle = useCallback(
    (value: string) => {
      updateFilterDraft(toggleValue(draft, cat, value));
    },
    [draft, cat],
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title,
          headerBackTitle: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#F2F2F7" },
          headerTitleStyle: { fontSize: 17, fontWeight: "600" },
        }}
      />

      <FlatList
        data={options}
        keyExtractor={(item) => item}
        renderItem={({ item: value, index }) => {
          const selected = selectedValues.includes(value);
          const label = FILTER_VALUE_LABELS[cat]?.[value] ?? value;

          return (
            <View>
              {index > 0 && <View style={styles.separator} />}
              <Pressable
                onPress={() => handleToggle(value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={label}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                <Text style={styles.rowLabel}>{label}</Text>
                {selected ? (
                  <View style={styles.checkFilled}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                ) : (
                  <View style={styles.checkEmpty} />
                )}
              </Pressable>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={styles.listHeader} />}
      />
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
  listHeader: {
    height: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E5EA",
    marginLeft: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 17,
    minHeight: 58,
    backgroundColor: "#fff",
  },
  rowPressed: {
    backgroundColor: "#F9F9F9",
  },
  rowLabel: {
    fontSize: 16,
    color: "#1C1C1E",
    fontWeight: "400",
    flex: 1,
  },
  checkFilled: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  checkEmpty: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#C7C7CC",
    backgroundColor: "transparent",
  },
});
