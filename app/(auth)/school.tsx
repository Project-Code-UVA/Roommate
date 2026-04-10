import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { SchoolSearch } from "@/components/onboarding/school-search";
import { COLORS } from "@/lib/constants";
import { useSession } from "@/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { addUserSchool, removeUserSchool } from "@/services/school-service";
import type { School } from "@/components/onboarding/school-search";

export default function SchoolScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { saveProgress } = useOnboarding();
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  const isValid = selectedSchools.length > 0;

  const handleAdd = useCallback(async (school: School) => {
    if (!session?.user.id) return;
    const { error } = await addUserSchool(session.user.id, school.id);
    if (error) {
      Alert.alert("Error", `Failed to add school: ${error}`);
      return;
    }
    setSelectedSchools((prev) => [...prev, school]);
  }, [session?.user.id]);

  const handleRemove = useCallback(async (school: School) => {
    if (!session?.user.id) return;
    const { error } = await removeUserSchool(session.user.id, school.id);
    if (error) {
      Alert.alert("Error", "Failed to remove school. Please try again.");
      return;
    }
    setSelectedSchools((prev) => prev.filter((s) => s.id !== school.id));
  }, [session?.user.id]);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      await saveProgress("school", { schoolIds: selectedSchools.map((s) => s.id) });
      router.push("/(auth)/photos");
    } catch {
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValid, selectedSchools, router]);

  return (
    <StepContainer
      title="What schools are you interested in?"
      subtitle="Add schools where you're looking for roommates"
      showBack
      onBack={() => router.back()}
      currentStep={6}
      totalSteps={10}
    >
      <View className="flex-1 mt-2">
        <SchoolSearch
          selectedSchools={selectedSchools}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      </View>

      {/* Continue button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          disabled={!isValid || loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: isValid ? COLORS.primary[600] : COLORS.gray[300],
            borderRadius: 999,
            // MODIFIED: increased button padding from 16 to 18 to match larger font scale
            paddingVertical: 18, // MODIFIED: button padding bumped +2
          }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            // MODIFIED: increased button text from ~18pt to 20pt
            <Text
              style={{ fontSize: 20 }} // MODIFIED: button text bumped +2pt for larger scale
              className="text-white font-semibold text-center"
            >
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
