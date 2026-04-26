/**
 * Photo preview before sending.
 *
 * Displays selected image with optional caption TextInput,
 * and Send/Cancel action buttons.
 */

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PhotoPreviewProps = {
  readonly uri: string;
  readonly onSend: (uri: string, caption?: string) => void;
  readonly onCancel: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PhotoPreview({ uri, onSend, onCancel }: PhotoPreviewProps) {
  const [caption, setCaption] = useState("");

  const handleSend = useCallback(() => {
    onSend(uri, caption.trim() || undefined);
  }, [uri, caption, onSend]);

  return (
    <View style={styles.container} testID="photo-preview">
      {/* Image */}
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="contain"
        testID="photo-preview-image"
      />

      {/* Caption input */}
      <TextInput
        style={styles.captionInput}
        placeholder="Add a caption..."
        placeholderTextColor="#9ca3af"
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={200}
      />

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    margin: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: "100%",
    height: 240,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
  },
  captionInput: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    fontSize: 15,
    color: "#111827",
    maxHeight: 80,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#7c3aed",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
});
