import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { COLORS } from "@/lib/constants";

export default function NameScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState(""); // MODIFIED: added lastName state variable
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = firstName.trim().length > 0;

  const handleContinue = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      // MODIFIED: combine first + last name into display_name for downstream compatibility
      const displayName = lastName.trim()
        ? `${firstName.trim()} ${lastName.trim()}`
        : firstName.trim();

      // TODO: call updateProfile(session.user.id, { display_name: displayName })
      // TODO: call saveProgress('name', { display_name: displayName })
      await new Promise((r) => setTimeout(r, 400));

      router.push("/(auth)/gender");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValid, firstName, lastName, router]);

  return (
    <StepContainer
      title="What's your name?"
      subtitle="This is how you'll appear to others"
      showBack
      onBack={() => router.back()}
      currentStep={4}
      totalSteps={9}
    >
      <View className="flex-1">
        {/* First Name label */}
        {/* // MODIFIED: increased label from ~14pt to 16pt */}
        <Text
          style={{ fontSize: 16 }} // MODIFIED: input label bumped +2pt
          className="text-gray-500 mb-2 mt-4 font-medium"
        >
          First Name
        </Text>

        {/* First Name input */}
        <TextInput
          value={firstName}
          onChangeText={(t) => { setFirstName(t); setError(null); }}
          placeholder="First name"
          placeholderTextColor={COLORS.gray[400]}
          autoFocus
          autoCapitalize="words"
          maxLength={30}
          style={{
            fontSize: 26, // MODIFIED: input text bumped +2pt (was ~24pt / text-2xl)
            fontWeight: "600",
            color: COLORS.gray[900],
            borderBottomWidth: 2,
            borderBottomColor: firstName ? COLORS.primary[600] : COLORS.gray[300],
            paddingBottom: 10,
          }}
        />

        {/* // MODIFIED: added Last Name input field below First Name, styled identically */}
        <Text
          style={{ fontSize: 16 }} // MODIFIED: input label bumped +2pt
          className="text-gray-500 mb-2 mt-6 font-medium"
        >
          Last Name
        </Text>

        {/* // MODIFIED: Last Name input — same styling as First Name */}
        <TextInput
          value={lastName}
          onChangeText={(t) => { setLastName(t); setError(null); }}
          placeholder="Last name"
          placeholderTextColor={COLORS.gray[400]}
          autoCapitalize="words"
          maxLength={30}
          style={{
            fontSize: 26, // MODIFIED: input text bumped +2pt (was ~24pt / text-2xl)
            fontWeight: "600",
            color: COLORS.gray[900],
            borderBottomWidth: 2,
            borderBottomColor: lastName ? COLORS.primary[600] : COLORS.gray[300],
            paddingBottom: 10,
          }}
        />

        {/* Error text */}
        {error && (
          <Text
            style={{ fontSize: 16 }} // MODIFIED: error text bumped +2pt
            className="text-red-500 mt-3"
          >
            {error}
          </Text>
        )}

        {/* // MODIFIED: increased helper text from ~14pt to 16pt */}
        <Text
          style={{ fontSize: 16 }} // MODIFIED: helper text bumped +2pt
          className="text-gray-400 mt-4"
        >
          Only your first name is visible to others
        </Text>
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
