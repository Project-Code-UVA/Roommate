/**
 * School selection onboarding step.
 *
 * Users must select at least one school to proceed. Schools establish
 * the shared-school gating that underpins Room's trust model.
 * Supports multiple school selection with add/remove via the
 * SchoolSearch autocomplete component.
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import type { Tables } from "@/types/database.types";

import { StepContainer } from "@/components/onboarding/step-container";
import { SchoolSearch } from "@/components/onboarding/school-search";
import { useSession } from "@/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import {
  addUserSchool,
  getUserSchools,
  removeUserSchool,
} from "@/services/school-service";

type School = Tables<"schools">;

export default function SchoolScreen() {
  const { session } = useSession();
  const { saveProgress } = useOnboarding();

  const [selectedSchools, setSelectedSchools] = useState<readonly School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = selectedSchools.length > 0 && !isSaving;

  // Load existing schools on mount (returning user)
  useEffect(() => {
    let mounted = true;

    async function loadExistingSchools() {
      if (!session?.user.id) {
        setIsLoading(false);
        return;
      }

      const schools = await getUserSchools(session.user.id);
      if (mounted) {
        setSelectedSchools(schools);
        setIsLoading(false);
      }
    }

    loadExistingSchools();

    return () => {
      mounted = false;
    };
  }, [session?.user.id]);

  const handleAdd = useCallback(
    async (school: School) => {
      if (!session?.user.id) return;

      setError(null);
      const result = await addUserSchool(session.user.id, school.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSelectedSchools((prev) => [...prev, school]);
    },
    [session?.user.id],
  );

  const handleRemove = useCallback(
    async (school: School) => {
      if (!session?.user.id) return;

      setError(null);
      const result = await removeUserSchool(session.user.id, school.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSelectedSchools((prev) => prev.filter((s) => s.id !== school.id));
    },
    [session?.user.id],
  );

  async function handleContinue() {
    if (!canContinue) return;

    setIsSaving(true);
    await saveProgress("school", {
      schoolIds: selectedSchools.map((s) => s.id),
    });
    setIsSaving(false);
    router.push("/(auth)/photos");
  }

  if (isLoading) {
    return (
      <StepContainer
        title="Where do you go to school?"
        subtitle="You'll connect with people at your school"
        onBack={() => router.back()}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      </StepContainer>
    );
  }

  return (
    <StepContainer
      title="Where do you go to school?"
      subtitle="You'll connect with people at your school"
      onBack={() => router.back()}
    >
      <View className="flex-1">
        <SchoolSearch
          selectedSchools={selectedSchools}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />

        {error ? (
          <Text className="mt-2 text-sm text-red-500">{error}</Text>
        ) : null}
      </View>

      <Pressable
        className={`mb-8 rounded-xl py-4 ${
          canContinue ? "bg-purple-600" : "bg-gray-300"
        }`}
        onPress={handleContinue}
        disabled={!canContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-center text-lg font-semibold text-white">
            Continue
          </Text>
        )}
      </Pressable>
    </StepContainer>
  );
}
