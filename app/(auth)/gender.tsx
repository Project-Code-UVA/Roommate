/**
 * Gender selection onboarding step.
 *
 * Offers four gender options (Man, Woman, Non-binary, More).
 * "More" reveals a free-text input. Includes a toggle for
 * showing gender on profile.
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Switch,
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

type GenderOption = "man" | "woman" | "non-binary" | "more";

const GENDER_OPTIONS: readonly { readonly key: GenderOption; readonly label: string }[] = [
  { key: "man", label: "Man" },
  { key: "woman", label: "Woman" },
  { key: "non-binary", label: "Non-binary" },
  { key: "more", label: "More" },
] as const;

const MAX_CUSTOM_GENDER_LENGTH = 50;

export default function GenderScreen() {
  const { session } = useSession();
  const { saveProgress } = useOnboarding();

  const [selected, setSelected] = useState<GenderOption | null>(null);
  const [customGender, setCustomGender] = useState("");
  const [showGender, setShowGender] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const trimmedCustom = customGender.trim();
  const canContinue =
    selected !== null &&
    (selected !== "more" || trimmedCustom.length > 0) &&
    !isSaving;

  function resolveGenderValue(): string {
    if (selected === "more") return trimmedCustom;
    return selected ?? "";
  }

  async function handleContinue() {
    if (!session?.user.id || !canContinue) return;

    setIsSaving(true);
    setError(null);

    const genderValue = resolveGenderValue();

    const result = await updateProfile(session.user.id, {
      gender: genderValue,
      show_gender: showGender,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    await saveProgress("gender", { gender: genderValue, show_gender: showGender });
    setIsSaving(false);
    router.push("/(auth)/school");
  }

  return (
    <StepContainer
      title="What's your gender?"
      onBack={() => router.back()}
    >
      <View className="flex-1">
        <View className="gap-3">
          {GENDER_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              className={`rounded-xl border-2 px-6 py-4 ${
                selected === option.key
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-300"
              }`}
              onPress={() => setSelected(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === option.key }}
              accessibilityLabel={option.label}
            >
              <Text
                className={`text-base font-medium ${
                  selected === option.key
                    ? "text-primary-700"
                    : "text-gray-900"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {selected === "more" ? (
          <TextInput
            className="mt-3 rounded-xl border-2 border-gray-300 px-6 py-4 text-base text-gray-900 focus:border-primary-600"
            placeholder="How do you identify?"
            placeholderTextColor={COLORS.gray[400]}
            value={customGender}
            onChangeText={setCustomGender}
            autoFocus
            maxLength={MAX_CUSTOM_GENDER_LENGTH}
            editable={!isSaving}
            accessibilityLabel="Custom gender identity"
          />
        ) : null}

        <View className="mt-6 flex-row items-center justify-between">
          <Text className="text-base text-gray-700">
            Show my gender on profile
          </Text>
          <Switch
            value={showGender}
            onValueChange={setShowGender}
            trackColor={{ false: COLORS.gray[300], true: COLORS.primary[600] }}
            thumbColor={COLORS.white}
            accessibilityLabel="Show gender on profile"
          />
        </View>

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
