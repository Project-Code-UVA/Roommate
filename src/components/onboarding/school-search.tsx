/**
 * School search with autocomplete and selected school chips.
 *
 * Debounces search input (300ms), queries the schools table,
 * and displays results in a dropdown. Selected schools appear
 * as removable chips below the search input.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Tables } from "@/types/database.types";

import { searchSchools } from "@/services/school-service";

type School = Tables<"schools">;

type SchoolSearchProps = {
  readonly selectedSchools: readonly School[];
  readonly onAdd: (school: School) => void;
  readonly onRemove: (school: School) => void;
};

const DEBOUNCE_MS = 300;

export function SchoolSearch({
  selectedSchools,
  onAdd,
  onRemove,
}: SchoolSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly School[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIds = new Set(selectedSchools.map((s) => s.id));

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      const schools = await searchSchools(searchQuery);
      const filtered = schools.filter((s) => !selectedIds.has(s.id));
      setResults(filtered);
      setIsSearching(false);
    },
    // Intentionally depend on a serialized version of selectedIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedSchools.length],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  function handleSelect(school: School) {
    onAdd(school);
    setQuery("");
    setResults([]);
  }

  return (
    <View>
      {/* Search input */}
      <View className="flex-row items-center rounded-xl border-2 border-gray-200 px-4 py-3">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          className="ml-2 flex-1 text-base text-gray-900"
          placeholder="Search for your school..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          accessibilityLabel="Search schools"
        />
        {isSearching ? (
          <Ionicons name="hourglass-outline" size={18} color="#9CA3AF" />
        ) : null}
      </View>

      {/* Results dropdown */}
      {results.length > 0 ? (
        <View className="mt-1 max-h-60 rounded-xl border border-gray-200 bg-white">
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                className="border-b border-gray-100 px-4 py-3"
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${item.name}`}
              >
                <Text className="text-base text-gray-900">{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}

      {/* Selected school chips */}
      {selectedSchools.length > 0 ? (
        <View className="mt-4">
          <View className="flex-row flex-wrap gap-2">
            {selectedSchools.map((school) => (
              <View
                key={school.id}
                className="flex-row items-center rounded-full bg-purple-100 px-3 py-1"
              >
                <Text className="mr-1 text-sm font-medium text-purple-700">
                  {school.name}
                </Text>
                <Pressable
                  onPress={() => onRemove(school)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${school.name}`}
                >
                  <Ionicons name="close" size={16} color="#7C3AED" />
                </Pressable>
              </View>
            ))}
          </View>

          <Text className="mt-3 text-sm text-gray-500">
            + Add another school
          </Text>
        </View>
      ) : null}
    </View>
  );
}
