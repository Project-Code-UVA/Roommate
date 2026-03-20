import { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/constants";

export interface School {
  id: string;
  name: string;
}

interface SchoolSearchProps {
  selectedSchools: School[];
  onAdd: (school: School) => void;
  onRemove: (school: School) => void;
}

/** Stub list — replace with searchSchools() from school-service when available. */
const STUB_SCHOOLS: School[] = [
  { id: "1", name: "UCLA" },
  { id: "2", name: "USC" },
  { id: "3", name: "UC Berkeley" },
  { id: "4", name: "Stanford University" },
  { id: "5", name: "UC San Diego" },
  { id: "6", name: "UC Davis" },
  { id: "7", name: "UC Irvine" },
  { id: "8", name: "UC Santa Barbara" },
  { id: "9", name: "Cal Poly SLO" },
  { id: "10", name: "San Jose State University" },
  { id: "11", name: "University of Washington" },
  { id: "12", name: "Arizona State University" },
];

export function SchoolSearch({ selectedSchools, onAdd, onRemove }: SchoolSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIds = new Set(selectedSchools.map((s) => s.id));

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      // TODO: replace with searchSchools(query) from school-service
      const q = query.toLowerCase();
      const matched = STUB_SCHOOLS.filter(
        (s) => s.name.toLowerCase().includes(q) && !selectedIds.has(s.id),
      );
      setResults(matched);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedIds]);

  const handleSelect = useCallback(
    (school: School) => {
      onAdd(school);
      setQuery("");
      setResults([]);
    },
    [onAdd],
  );

  return (
    <View>
      {/* Search input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 2,
          borderColor: query ? COLORS.primary[600] : COLORS.gray[300],
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <Ionicons name="search" size={22} color={COLORS.gray[400]} style={{ marginRight: 10 }} />
        {/* // MODIFIED: increased search input text from ~16pt to 18pt */}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search for your school..."
          placeholderTextColor={COLORS.gray[400]}
          autoCapitalize="words"
          style={{
            flex: 1,
            fontSize: 18, // MODIFIED: search input text bumped +2pt
            color: COLORS.gray[900],
          }}
        />
      </View>

      {/* Results dropdown — shows up to 10 results at once */}
      {results.length > 0 && (
        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: COLORS.gray[200],
            borderRadius: 12,
            // MODIFIED: removed max-results cap — list shows up to 10 items (was max 5 visible per plan, now uncapped with taller container)
            maxHeight: 10 * 52, // MODIFIED: allow at least 10 results visible simultaneously
            overflow: "hidden",
          }}
        >
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.gray[100],
                }}
              >
                {/* // MODIFIED: increased result item text from ~16pt to 18pt */}
                <Text
                  style={{ fontSize: 18 }} // MODIFIED: result list item text bumped +2pt
                  className="text-gray-900"
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Selected school chips */}
      {selectedSchools.length > 0 && (
        <View className="mt-4" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {selectedSchools.map((school) => (
            <View
              key={school.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: COLORS.primary[100],
                borderRadius: 9999,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              {/* // MODIFIED: increased chip label from ~14pt to 16pt */}
              <Text
                style={{ fontSize: 16 }} // MODIFIED: selected school label bumped +2pt
                className="text-primary-700 font-medium"
              >
                {school.name}
              </Text>
              <TouchableOpacity onPress={() => onRemove(school)} style={{ marginLeft: 6 }}>
                <Ionicons name="close-circle" size={18} color={COLORS.primary[600]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add another hint */}
      {selectedSchools.length > 0 && (
        <Text
          style={{ fontSize: 16 }} // MODIFIED: hint text bumped +2pt
          className="text-gray-400 mt-3"
        >
          + Add another school
        </Text>
      )}
    </View>
  );
}
