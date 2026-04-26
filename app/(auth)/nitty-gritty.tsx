import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/lib/constants";
import { useSession } from "@/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { markOnboardingComplete } from "@/services/auth-service";
import { updateProfile } from "@/services/profile-service";
import { getNittyGritty } from "@/services/filter-service";
import {
  FILTER_OPTIONS,
  FILTER_LABELS,
  FILTER_VALUE_LABELS,
  FILTER_CATEGORY_ORDER,
} from "@/constants/filter-options";
import { OnboardingProgressBar } from "@/components/onboarding/progress-bar";
import type { Json } from "@/types/database.types";
import type { FilterCategory } from "@/types/filters";

type SelfSelections = Partial<Record<FilterCategory, string>>;

const TOTAL_STEPS = 10;
const CURRENT_STEP = 10;

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

export default function NittyGrittyScreen() {
  const router = useRouter();
  const { session, refreshOnboardingStatus } = useSession();
  const { clearProgress } = useOnboarding();
  const [selections, setSelections] = useState<SelfSelections>({});
  const [loading, setLoading] = useState(false);

  const answeredCount = Object.keys(selections).length;
  const totalCategories = FILTER_CATEGORY_ORDER.length;

  const toggleOption = useCallback((category: FilterCategory, value: string) => {
    setSelections((prev) => {
      // Tap same chip again to deselect
      if (prev[category] === value) {
        const { [category]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: value };
    });
  }, []);

  const handleContinue = useCallback(async () => {
    if (!session?.user.id) return;
    const userId = session.user.id;
    setLoading(true);

    try {
      const current = await getNittyGritty(userId);
      const existing = current.data ?? { self: {}, preferences: {} };
      const next = {
        self: selections,
        preferences: existing.preferences,
      };

      const profileResult = await updateProfile(userId, {
        nitty_gritty: next as unknown as Json,
      });
      if (profileResult.error) {
        Alert.alert("Error", `Failed to save: ${profileResult.error}`);
        return;
      }

      const complete = await markOnboardingComplete(userId);
      if (complete.error) {
        Alert.alert("Error", `Failed to complete profile: ${complete.error}`);
        return;
      }

      await Promise.all([refreshOnboardingStatus(), clearProgress()]);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Failed to save your lifestyle. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [session?.user.id, selections, router, refreshOnboardingStatus, clearProgress]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.gray[800]} />
        </TouchableOpacity>
        <OnboardingProgressBar
          currentStep={CURRENT_STEP}
          totalSteps={TOTAL_STEPS}
        />
      </View>

      {/* Title */}
      <View style={styles.titleArea}>
        <Text style={styles.title}>Your lifestyle</Text>
        <Text style={styles.subtitle}>
          Help future roommates know what it's like to live with you.
        </Text>
      </View>

      {/* Category list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {FILTER_CATEGORY_ORDER.map((category) => (
          <View key={category} style={styles.categoryBlock}>
            <View style={styles.categoryHeader}>
              <Ionicons
                name={CATEGORY_ICONS[category] as "moon-outline"}
                size={16}
                color={COLORS.primary[500]}
                style={styles.categoryIcon}
              />
              <Text style={styles.categoryLabel}>{FILTER_LABELS[category]}</Text>
            </View>
            <View style={styles.chipRow}>
              {FILTER_OPTIONS[category].map((value) => {
                const selected = selections[category] === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => toggleOption(category, value)}
                    activeOpacity={0.7}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {FILTER_VALUE_LABELS[category][value]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {answeredCount > 0 && (
          <Text style={styles.answeredCount}>
            {answeredCount} of {totalCategories} answered
          </Text>
        )}
        <TouchableOpacity
          onPress={handleContinue}
          disabled={loading}
          activeOpacity={0.85}
          style={styles.button}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>
              {answeredCount === 0 ? "Skip for now" : "Continue"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backButton: {
    width: 28,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.gray[200],
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary[600],
    borderRadius: 9999,
  },
  titleArea: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
    color: COLORS.gray[900],
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.gray[500],
    marginTop: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  categoryBlock: {
    marginBottom: 24,
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
    gap: 8,
  },
  answeredCount: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: "center",
  },
  button: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 9999,
    paddingVertical: 18,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
