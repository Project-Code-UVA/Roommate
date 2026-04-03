import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { COLORS } from "@/lib/constants";
import { useSession } from "@/contexts/auth-context";
import { updateProfile } from "@/services/profile-service";
import { markOnboardingComplete } from "@/services/auth-service";
import { useOnboarding } from "@/hooks/use-onboarding";

const MAX_BIO = 300;
const WARN_THRESHOLD = 280;

export default function BioScreen() {
  const router = useRouter();
  const { session, refreshOnboardingStatus } = useSession();
  const { clearProgress } = useOnboarding();
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  const isValid = bio.trim().length > 0;
  const isNearLimit = bio.length >= WARN_THRESHOLD;

  const handleComplete = useCallback(async () => {
    if (!isValid || !session?.user.id) return;
    setLoading(true);

    try {
      const profileResult = await updateProfile(session.user.id, { bio: bio.trim() });
      if (profileResult.error) {
        Alert.alert("Error", `Failed to save your bio: ${profileResult.error}`);
        return;
      }

      const onboardingResult = await markOnboardingComplete(session.user.id);
      if (onboardingResult.error) {
        Alert.alert("Error", `Failed to complete profile: ${onboardingResult.error}`);
        return;
      }

      await Promise.all([refreshOnboardingStatus(), clearProgress()]);

      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Failed to save your bio. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValid, bio, session?.user.id, refreshOnboardingStatus, clearProgress, router]);

  return (
    <StepContainer
      title="Write your bio"
      // MODIFIED: changed subtitle prompt to requested text
      subtitle="What do you want your future roommate to know about you?" // MODIFIED: updated bio prompt question
      showBack
      onBack={() => router.back()}
      currentStep={8}
      totalSteps={9}
    >
      <View className="flex-1">
        {/* Bio text area */}
        <TextInput
          value={bio}
          onChangeText={setBio}
          // MODIFIED: changed placeholder to match new prompt question
          placeholder="What do you want your future roommate to know about you?" // MODIFIED: updated placeholder text
          placeholderTextColor={COLORS.gray[400]}
          multiline
          maxLength={MAX_BIO}
          textAlignVertical="top"
          style={{
            fontSize: 18, // MODIFIED: text area font bumped +2pt (was ~16pt)
            color: COLORS.gray[900],
            borderWidth: 2,
            borderColor: bio ? COLORS.primary[600] : COLORS.gray[300],
            borderRadius: 12,
            padding: 16,
            minHeight: 140,
          }}
        />

        {/* Character counter */}
        {/* // MODIFIED: increased counter text from ~14pt to 16pt */}
        <Text
          style={{ fontSize: 16 }} // MODIFIED: character count text bumped +2pt
          className={`text-right mt-2 ${isNearLimit ? "text-red-500" : "text-gray-500"}`}
        >
          {bio.length}/{MAX_BIO}
        </Text>
      </View>

      {/* Complete Profile button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={handleComplete}
          disabled={!isValid || loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: isValid ? COLORS.primary[600] : COLORS.gray[300],
            borderRadius: 999, // MODIFIED: fully rounded pill shape
            paddingVertical: 18,
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
              Complete Profile
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
