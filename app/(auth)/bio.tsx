/**
 * Bio entry onboarding step -- the final step.
 *
 * User writes a short bio (300 char max) and taps "Complete Profile"
 * to mark onboarding as complete. On success, auth context refreshes
 * and the user is redirected to the main tabs.
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { markOnboardingComplete } from "@/services/auth-service";

const MAX_BIO_LENGTH = 300;
const WARNING_THRESHOLD = 280;

export default function BioScreen() {
  const { session, refreshOnboardingStatus } = useSession();
  const { clearProgress } = useOnboarding();

  const [bio, setBio] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedBio = bio.trim();
  const canComplete = trimmedBio.length > 0 && !isSubmitting;
  const charCount = bio.length;
  const isNearLimit = charCount >= WARNING_THRESHOLD;

  async function handleComplete() {
    if (!canComplete || !session?.user.id) return;

    setIsSubmitting(true);

    try {
      // Step 1: Save bio to profile
      const profileResult = await updateProfile(session.user.id, {
        bio: trimmedBio,
      });

      if (profileResult.error) {
        Alert.alert("Error", profileResult.error);
        setIsSubmitting(false);
        return;
      }

      // Step 2: Mark onboarding as complete
      const completeResult = await markOnboardingComplete(session.user.id);

      if (completeResult.error) {
        Alert.alert("Error", completeResult.error);
        setIsSubmitting(false);
        return;
      }

      // Step 3: Refresh auth context so tabs layout knows onboarding is done
      await refreshOnboardingStatus();

      // Step 4: Clear AsyncStorage onboarding progress
      await clearProgress();

      // Step 5: Navigate to main app (tabs layout will see onboardingComplete = true)
      router.replace("/(tabs)");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Error", message);
      setIsSubmitting(false);
    }
  }

  return (
    <StepContainer
      title="Write your bio"
      subtitle="What should your future roommate know about you?"
      onBack={() => router.back()}
    >
      <View className="flex-1">
        <TextInput
          className={`min-h-[120px] rounded-xl border p-4 text-base text-gray-900 ${
            isFocused ? "border-purple-600" : "border-gray-300"
          }`}
          placeholder="What should your future roommate know about you?"
          placeholderTextColor="#9CA3AF"
          multiline
          textAlignVertical="top"
          maxLength={MAX_BIO_LENGTH}
          value={bio}
          onChangeText={setBio}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel="Bio"
          accessibilityHint={`Write about yourself, ${MAX_BIO_LENGTH} characters maximum`}
        />

        <Text
          className={`mt-2 text-right text-sm ${
            isNearLimit ? "text-red-500" : "text-gray-500"
          }`}
        >
          {charCount}/{MAX_BIO_LENGTH}
        </Text>
      </View>

      <Pressable
        className={`mb-8 rounded-xl py-4 ${
          canComplete ? "bg-purple-600" : "bg-gray-300"
        }`}
        onPress={handleComplete}
        disabled={!canComplete}
        accessibilityRole="button"
        accessibilityLabel="Complete Profile"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text className="text-center text-lg font-semibold text-white">
            Complete Profile
          </Text>
        )}
      </Pressable>
    </StepContainer>
  );
}
