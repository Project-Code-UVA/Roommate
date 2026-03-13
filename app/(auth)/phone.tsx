/**
 * Phone number entry screen.
 *
 * Collects the user's US phone number and sends an OTP code
 * via Supabase Auth. Formats display as (xxx) xxx-xxxx.
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { StepContainer } from "@/components/onboarding/step-container";
import { sendOtp } from "@/services/auth-service";
import { useOnboarding } from "@/hooks/use-onboarding";
import { COLORS } from "@/lib/constants";

/** Format raw digits as +1 (xxx) xxx-xxxx for display. */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "+1 ";
  if (digits.length <= 3) return `+1 (${digits}`;
  if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function PhoneScreen() {
  const router = useRouter();
  const { saveProgress } = useOnboarding();

  const [rawDigits, setRawDigits] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValid = rawDigits.length === 10;

  function handleChangeText(text: string) {
    const allDigits = text.replace(/\D/g, "");
    // Strip the leading "1" from the country code prefix
    const digits = allDigits.startsWith("1") ? allDigits.slice(1).slice(0, 10) : allDigits.slice(0, 10);
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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View className="flex-1">
          <View className="mt-4">
            {/* Phone input row */}
            <View className="h-14 justify-center rounded-xl border-2 border-gray-300 px-4">
              <TextInput
                style={{ fontSize: 18, color: '#111827', paddingVertical: 0 }}
                value={formatPhone(rawDigits)}
                onChangeText={handleChangeText}
                keyboardType="phone-pad"
                placeholder="+1 (555) 555-5555"
                placeholderTextColor={COLORS.gray[400]}
                maxLength={18}
                accessibilityLabel="Phone number"
                testID="phone-input"
                autoFocus
                selection={{
                  start: formatPhone(rawDigits).length,
                  end: formatPhone(rawDigits).length,
                }}
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
              isValid && !isLoading ? "bg-primary-600" : "bg-gray-300"
            }`}
            accessibilityRole="button"
            accessibilityLabel="Send Code"
            accessibilityState={{ disabled: !isValid || isLoading }}
            testID="phone-send-code"
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
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
        </View>
      </TouchableWithoutFeedback>
    </StepContainer>
  );
}
