import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Switch, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { COLORS } from "@/lib/constants";
import { useSession } from "@/contexts/auth-context";
import { updateProfile } from "@/services/profile-service";
import { useOnboarding } from "@/hooks/use-onboarding";

/** Internal value kept as "more" for backend compatibility; display label is "Other". */
const GENDER_OPTIONS = [
  { label: "Man", value: "man" },
  { label: "Woman", value: "woman" },
  { label: "Non-binary", value: "non-binary" },
  { label: "Other", value: "more" }, // MODIFIED: renamed "More" to "Other" (display only; stored value stays "more")
] as const;

type GenderValue = (typeof GENDER_OPTIONS)[number]["value"];

export default function GenderScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { saveProgress } = useOnboarding();
  const [selected, setSelected] = useState<GenderValue | null>(null);
  const [customGender, setCustomGender] = useState("");
  const [showGender, setShowGender] = useState(true);
  const [loading, setLoading] = useState(false);

  const isMoreSelected = selected === "more";
  const isValid = selected !== null && (!isMoreSelected || customGender.trim().length > 0);

  const handleContinue = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);

    try {
      const genderValue = isMoreSelected ? customGender.trim() : selected;

      if (!session?.user.id) return;

      const { error: profileError } = await updateProfile(session.user.id, {
        gender: genderValue,
        show_gender: showGender,
      });
      if (profileError) throw new Error(profileError);

      await saveProgress("gender", { gender: genderValue, show_gender: showGender });
      router.push("/(auth)/school");
    } catch {
      // TODO: show user-facing error
    } finally {
      setLoading(false);
    }
  }, [isValid, selected, isMoreSelected, customGender, showGender, router]);

  return (
    <StepContainer
      title="What's your gender?"
      showBack
      onBack={() => router.back()}
      currentStep={5}
      totalSteps={11}
    >
      <View className="flex-1">
        {/* Gender options */}
        <View className="mt-2" style={{ gap: 12 }}>
          {GENDER_OPTIONS.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => {
                  setSelected(opt.value);
                  if (opt.value !== "more") setCustomGender("");
                }}
                activeOpacity={0.8}
                style={{
                  borderWidth: 2,
                  borderColor: isActive ? COLORS.primary[600] : COLORS.gray[200],
                  backgroundColor: isActive ? COLORS.primary[50] : "transparent",
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                }}
              >
                <Text
                  style={{ fontSize: 18 }}
                  className={`font-medium ${isActive ? "text-primary-700" : "text-gray-900"}`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Free-text input for "Other" (value: "more") */}
        {isMoreSelected && (
          <TextInput
            value={customGender}
            onChangeText={setCustomGender}
            placeholder="How do you identify?"
            placeholderTextColor={COLORS.gray[400]}
            autoFocus
            maxLength={50}
            style={{
              fontSize: 20,
              fontWeight: "500",
              color: COLORS.gray[900],
              borderBottomWidth: 2,
              borderBottomColor: customGender ? COLORS.primary[600] : COLORS.gray[300],
              paddingBottom: 8,
              marginTop: 16,
            }}
          />
        )}

        {/* Show gender toggle */}
        <View className="flex-row items-center justify-between mt-8">
          <Text style={{ fontSize: 16 }} className="text-gray-700 font-medium">
            Show my gender on profile
          </Text>
          <Switch
            value={showGender}
            onValueChange={setShowGender}
            trackColor={{ false: COLORS.gray[300], true: COLORS.primary[600] }}
            thumbColor={COLORS.white}
          />
        </View>
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
            paddingVertical: 18,
          }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text
              style={{ fontSize: 20 }}
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
