import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { DatePicker } from "@/components/onboarding/date-picker";
import { COLORS } from "@/lib/constants";
import { useOnboarding } from "@/hooks/use-onboarding";

/** Check if the user is at least 18 years old. */
function validateAge(birthdate: Date): boolean {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age >= 18;
}

function defaultBirthdate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

export default function BirthdayScreen() {
  const router = useRouter();
  const { saveProgress } = useOnboarding();
  const [selectedDate, setSelectedDate] = useState<Date>(defaultBirthdate);

  const handleContinue = useCallback(async () => {
    if (!validateAge(selectedDate)) {
      Alert.alert(
        "Age Requirement",
        "You must be 18+ to use Room. Come back when you're old enough!",
        [{ text: "OK", onPress: () => router.replace("/(auth)/welcome") }],
      );
      return;
    }
    await saveProgress("birthday", { birthdate: selectedDate.toISOString() });
    router.push("/(auth)/signup");
  }, [selectedDate, router, saveProgress]);

  const today = new Date();
  const minDate = new Date(today.getFullYear() - 100, 0, 1);

  return (
    <StepContainer
      title="When's your birthday?"
      subtitle="We need this to verify your age"
      showBack
      onBack={() => router.replace("/(auth)/welcome")}
      currentStep={1}
      totalSteps={9}
    >
      {/* Date picker */}
      <View className="flex-1 justify-center">
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          maximumDate={today}
          minimumDate={minDate}
        />

        {/* // MODIFIED: increased helper text from 14pt to 16pt */}
        <Text
          style={{ fontSize: 16 }} // MODIFIED: helper text bumped +2pt
          className="text-center text-gray-400 mt-6"
        >
          Your birthday won't be shown publicly
        </Text>
      </View>

      {/* Continue button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          style={{
            backgroundColor: COLORS.primary[600],
            borderRadius: 999, // MODIFIED: fully rounded pill shape (was rounded-xl / ~12)
            paddingVertical: 18,
          }}
        >
          {/* // MODIFIED: increased button text from 18pt to 20pt to match larger font scale */}
          <Text
            style={{ fontSize: 20 }} // MODIFIED: button text bumped +2pt for larger scale
            className="text-white font-semibold text-center"
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
