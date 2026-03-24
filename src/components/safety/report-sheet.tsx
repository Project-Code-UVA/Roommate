/**
 * Report category selection bottom sheet.
 *
 * Displays 8 report categories with icons, optional description textarea,
 * and submit button. Uses @gorhom/bottom-sheet for consistent sheet behavior.
 *
 * All 8 categories per PRD Section 7 and UI-SPEC.
 */

import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ReportCategory } from "@/types/chat";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReportSheetProps = {
  readonly visible: boolean;
  readonly userName: string;
  readonly onSubmit: (category: ReportCategory, description: string) => void;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
};

// ---------------------------------------------------------------------------
// Report categories with display info (per UI-SPEC)
// ---------------------------------------------------------------------------

type CategoryConfig = {
  readonly key: ReportCategory;
  readonly label: string;
  readonly icon: string;
};

const REPORT_CATEGORIES: readonly CategoryConfig[] = [
  { key: "harassment", label: "Harassment", icon: "hand-left-outline" },
  { key: "sexual_content", label: "Sexual Content", icon: "eye-off-outline" },
  { key: "hate_speech", label: "Hate Speech", icon: "megaphone-outline" },
  { key: "spam", label: "Spam", icon: "mail-unread-outline" },
  { key: "impersonation", label: "Impersonation", icon: "people-outline" },
  { key: "underage", label: "Underage User", icon: "alert-circle-outline" },
  { key: "safety_threat", label: "Safety Threat", icon: "warning-outline" },
  {
    key: "other",
    label: "Other",
    icon: "ellipsis-horizontal-circle-outline",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReportSheet({
  visible,
  userName,
  onSubmit,
  onClose,
  isSubmitting,
}: ReportSheetProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<ReportCategory | null>(null);
  const [description, setDescription] = useState("");

  // Present/dismiss based on visible prop
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
      // Reset state on close
      setSelectedCategory(null);
      setDescription("");
    }
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setSelectedCategory(null);
    setDescription("");
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    if (!selectedCategory || isSubmitting) return;
    onSubmit(selectedCategory, description);
  }, [selectedCategory, description, isSubmitting, onSubmit]);

  const handleSelectCategory = useCallback((category: ReportCategory) => {
    setSelectedCategory(category);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={["70%"]}
      onDismiss={handleDismiss}
    >
      <BottomSheetScrollView style={styles.content}>
        {/* Header */}
        <Text style={styles.heading}>Report {userName}</Text>

        {/* Category list */}
        {REPORT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              style={[
                styles.categoryRow,
                isSelected && styles.categoryRowSelected,
              ]}
              onPress={() => handleSelectCategory(cat.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              testID={`report-category-${cat.key}`}
            >
              <Ionicons
                name={cat.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={isSelected ? "#7c3aed" : "#6b7280"}
              />
              <Text
                style={[
                  styles.categoryLabel,
                  isSelected && styles.categoryLabelSelected,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          );
        })}

        {/* Description textarea (shown after category selection) */}
        {selectedCategory !== null && (
          <TextInput
            style={styles.descriptionInput}
            placeholder="Add details (optional)"
            placeholderTextColor="#9ca3af"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
            testID="report-description"
          />
        )}

        {/* Submit button */}
        <Pressable
          style={[
            styles.submitButton,
            selectedCategory !== null && !isSubmitting
              ? styles.submitButtonEnabled
              : styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={selectedCategory === null || isSubmitting}
          testID="report-submit"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text
              style={[
                styles.submitButtonText,
                selectedCategory === null && styles.submitButtonTextDisabled,
              ]}
            >
              Submit Report
            </Text>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryRowSelected: {
    backgroundColor: "#f5f3ff",
    borderLeftWidth: 3,
    borderLeftColor: "#7c3aed",
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  categoryLabelSelected: {
    color: "#7c3aed",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    minHeight: 80,
    fontSize: 16,
    color: "#111827",
    textAlignVertical: "top",
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonEnabled: {
    backgroundColor: "#ef4444",
  },
  submitButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  submitButtonTextDisabled: {
    color: "#9ca3af",
  },
});
