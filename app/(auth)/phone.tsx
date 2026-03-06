/**
 * Phone number entry screen.
 *
 * Collects the user's US phone number and sends an OTP code
 * via Supabase Auth. Formats display as (xxx) xxx-xxxx.
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { StepContainer } from "@/components/onboarding/step-container";
import { sendOtp } from "@/services/auth-service";
import { useOnboarding } from "@/hooks/use-onboarding";
import { COLORS } from "@/lib/constants";

/** Format raw digits as (xxx) xxx-xxxx for display. */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Extract raw digits from formatted phone. */
function extractDigits(formatted: string): string {
  return formatted.replace(/\D/g, "").slice(0, 10);
}

export default function PhoneScreen() {
  const router = useRouter();
  const { saveProgress } = useOnboarding();

  const [rawDigits, setRawDigits] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = rawDigits.length === 10;

  function handleChangeText(text: string) {
    const digits = extractDigits(text);
    setRawDigits(digits);
    if (errorMessage) setErrorMessage(null);
  }

  function handleBack() {
    router.back();
  }

  async function handleSendCode() {
    if (!isValid || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await sendOtp(rawDigits);

      if (error) {
        setErrorMessage(error);
        return;
      }

      await saveProgress("phone", { phone: rawDigits });
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { phone: rawDigits },
      });
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <StepContainer
      title="What's your phone number?"
      subtitle="We'll send you a verification code"
      onBack={handleBack}
    >
      <View className="mt-4">
        {/* Phone input row */}
        <View className="flex-row items-center rounded-xl border-2 border-gray-300 px-4">
          <Text className="mr-2 text-lg font-semibold text-gray-700">+1</Text>
          <TextInput
            value={formatPhone(rawDigits)}
            onChangeText={handleChangeText}
            keyboardType="phone-pad"
            placeholder="(555) 555-5555"
            placeholderTextColor={COLORS.gray[400]}
            className="flex-1 py-4 text-lg text-gray-900"
            maxLength={14}
            accessibilityLabel="Phone number"
            autoFocus
          />
        </View>

        {/* Error message */}
        {errorMessage ? (
          <Text className="mt-2 text-sm text-red-500">{errorMessage}</Text>
        ) : null}
      </View>

      <View className="flex-1" />

      {/* Send Code button */}
      <Pressable
        onPress={handleSendCode}
        disabled={!isValid || isLoading}
        className={`mb-8 w-full rounded-xl py-4 ${
          isValid && !isLoading ? "bg-purple-600" : "bg-gray-300"
        }`}
        accessibilityRole="button"
        accessibilityLabel="Send Code"
        accessibilityState={{ disabled: !isValid || isLoading }}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text
            className={`text-center text-lg font-semibold ${
              isValid ? "text-white" : "text-gray-500"
            }`}
          >
            Send Code
          </Text>
        )}
      </Pressable>
    </StepContainer>
  );
}
