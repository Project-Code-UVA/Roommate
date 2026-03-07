/**
 * Birthday / age gate screen.
 *
 * Collects the user's birthdate via a scroll-wheel date picker.
 * Under-18 users see a friendly block message and cannot proceed.
 * 18+ users save their birthdate and navigate to the phone step.
 */

import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { StepContainer } from "@/components/onboarding/step-container";
import { DatePicker } from "@/components/onboarding/date-picker";
import { validateAge } from "@/services/auth-service";
import { useOnboarding } from "@/hooks/use-onboarding";

function getDefaultBirthdate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
}

export default function BirthdayScreen() {
  const router = useRouter();
  const { saveProgress } = useOnboarding();
  const [selectedDate, setSelectedDate] = useState<Date>(getDefaultBirthdate);

  function handleBack() {
    router.replace("/welcome");
  }

  async function handleContinue() {
    const isOldEnough = validateAge(selectedDate);

    if (!isOldEnough) {
      Alert.alert(
        "Age Requirement",
        "You must be 18+ to use Room. Come back when you're old enough!",
        [{ text: "OK", onPress: () => router.replace("/welcome") }],
      );
      return;
    }

    await saveProgress("birthday", {
      birthdate: selectedDate.toISOString(),
    });
    router.push("/(auth)/phone");
  }

  return (
    <StepContainer
      title="When's your birthday?"
      subtitle="We need this to verify your age"
      onBack={handleBack}
    >
      <View className="flex-1 justify-center">
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
      </View>

      <Pressable
        onPress={handleContinue}
        className="mb-8 w-full rounded-xl bg-primary-600 py-4"
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <Text className="text-center text-lg font-semibold text-white">
          Continue
        </Text>
      </Pressable>
    </StepContainer>
  );
}
