/**
 * GIF search panel for message composer.
 *
 * Displays a search bar and 2-column grid of GIFs from the useGifSearch hook.
 * Shows trending GIFs initially, switches to search results on input.
 * Includes GIPHY attribution per ToS.
 */

import { Ionicons } from "@expo/vector-icons";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";

import { useGifSearch } from "@/hooks/use-gif-search";
import type { GifResult } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GifSearchPanelProps = {
  readonly onSelectGif: (gif: GifResult) => void;
  readonly onClose: () => void;
  readonly height: number;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GifSearchPanel({
  onSelectGif,
  onClose,
  height,
}: GifSearchPanelProps) {
  const { query, results, isLoading, search } = useGifSearch();

  const handleChangeText = useCallback(
    (text: string) => {
      search(text);
    },
    [search],
  );

  const renderGifCell = useCallback(
    ({ item }: { readonly item: GifResult }) => {
      const aspectRatio = item.width / item.height;
      return (
        <Pressable
          style={[styles.gifCell, { aspectRatio }]}
          onPress={() => onSelectGif(item)}
          testID={`gif-cell-${item.id}`}
        >
          <Image
            source={{ uri: item.previewUrl }}
            style={styles.gifImage}
            contentFit="cover"
          />
        </Pressable>
      );
    },
    [onSelectGif],
  );

  const keyExtractor = useCallback((item: GifResult) => item.id, []);

  return (
    <View style={[styles.container, { height }]}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search GIFs"
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={handleChangeText}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="#6b7280" />
        </Pressable>
      </View>

      {/* GIF grid or loading */}
      {isLoading && results.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" testID="gif-loading" />
        </View>
      ) : (
        <FlatList
          data={results as GifResult[]}
          renderItem={renderGifCell}
          keyExtractor={keyExtractor}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* GIPHY attribution */}
      <Text style={styles.attribution}>Powered by GIPHY</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    padding: 0,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  columnWrapper: {
    gap: 4,
    paddingHorizontal: 4,
  },
  gridContent: {
    paddingVertical: 4,
    gap: 4,
  },
  gifCell: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  gifImage: {
    width: "100%",
    height: "100%",
  },
  attribution: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    paddingVertical: 4,
  },
});
