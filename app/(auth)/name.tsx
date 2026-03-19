/**
 * Name entry onboarding step.
 *
 * Collects the user's first name and saves it to their profile.
 * Name is displayed to other users on their profile card.
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { StepContainer } from "@/components/onboarding/step-container";
import { useSession } from "@/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { updateProfile } from "@/services/profile-service";
import { COLORS } from "@/lib/constants";

const MAX_NAME_LENGTH = 30;

export default function NameScreen() {
  const { session } = useSession();
  const { saveProgress } = useOnboarding();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedName = name.trim();
  const canContinue = trimmedName.length > 0 && !isSaving;

  async function handleContinue() {
    if (!session?.user.id || !canContinue) return;

    setIsSaving(true);
    setError(null);

    const result = await updateProfile(session.user.id, {
      display_name: trimmedName,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    await saveProgress("name", { display_name: trimmedName });
    setIsSaving(false);
    router.push("/(auth)/gender");
  }

  return (
    <StepContainer
      title="What's your first name?"
      subtitle="This is how you'll appear to others"
      onBack={() => router.back()}
    >
      <View className="flex-1">
        <TextInput
          className="border-b-2 border-gray-300 pb-2 text-2xl font-semibold text-gray-900 focus:border-primary-600"
          placeholder="First name"
          placeholderTextColor={COLORS.gray[400]}
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          maxLength={MAX_NAME_LENGTH}
          editable={!isSaving}
          accessibilityLabel="First name"
          testID="name-input"
        />

        {error ? (
          <Text className="mt-2 text-sm text-red-500">{error}</Text>
        ) : null}
      </View>

      <Pressable
        className={`mb-8 rounded-xl py-4 ${
          canContinue ? "bg-primary-600" : "bg-gray-300"
        }`}
        onPress={handleContinue}
        disabled={!canContinue}
        accessibilityRole="button"
        accessibilityLabel="Continue"
        accessibilityState={{ disabled: !canContinue }}
        testID="name-continue"
      >
        {isSaving ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text
            className={`text-center text-lg font-semibold ${
              canContinue ? "text-white" : "text-gray-500"
            }`}
          >
            Continue
          </Text>
        )}
      </Pressable>
    </StepContainer>
  );
}
