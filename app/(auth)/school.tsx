import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { SchoolSearch } from "@/components/onboarding/school-search";
import { COLORS } from "@/lib/constants";
import type { School } from "@/components/onboarding/school-search";

export default function SchoolScreen() {
  const router = useRouter();
  const [selectedSchools, setSelectedSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);

  const isValid = selectedSchools.length > 0;

  const handleAdd = useCallback((school: School) => {
    // TODO: call addUserSchool(session.user.id, school.id)
    setSelectedSchools((prev) => [...prev, school]);
  }, []);

  const handleRemove = useCallback((school: School) => {
    // TODO: call removeUserSchool(session.user.id, school.id)
    setSelectedSchools((prev) => prev.filter((s) => s.id !== school.id));
  }, []);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      // TODO: call saveProgress('school', { schoolIds: selectedSchools.map(s => s.id) })
      await new Promise((r) => setTimeout(r, 400));
      router.push("/(auth)/photos");
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  }, [isValid, selectedSchools, router]);

  return (
    <StepContainer
      title="Where do you go to school?"
      subtitle="You'll connect with people at your school"
      showBack
      onBack={() => router.back()}
      currentStep={6}
      totalSteps={9}
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
