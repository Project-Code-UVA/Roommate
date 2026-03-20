import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { COLORS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

/** Format raw digits as (xxx) xxx-xxxx */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function PhoneScreen() {
  const router = useRouter();
  const [rawDigits, setRawDigits] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isValid = rawDigits.length === 10;

  const handleChangeText = useCallback((text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setRawDigits(digits);
    setError(null);
  }, []);

  const handleSend = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+1${rawDigits}`,
      });
      if (error) throw error;

      router.push({ pathname: "/(auth)/verify-otp", params: { phone: rawDigits } });
    } catch {
      setError("Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isValid, rawDigits, router]);

  return (
    <StepContainer
      title="What's your phone number?"
      subtitle="We'll send you a verification code"
      showBack
      onBack={() => router.back()}
      currentStep={2}
      totalSteps={9}
    >
      <View className="flex-1">
        {/* Phone input row */}
        <View className="flex-row items-center mt-4">
          {/* // MODIFIED: increased country code label from ~18pt to 20pt */}
          <Text
            style={{ fontSize: 20 }} // MODIFIED: country code text bumped +2pt
            className="font-semibold text-gray-900 mr-3"
          >
            +1
          </Text>
          <TextInput
            value={formatPhone(rawDigits)}
            onChangeText={handleChangeText}
            keyboardType="number-pad"
            placeholder="(555) 555-5555"
            placeholderTextColor={COLORS.gray[400]}
            maxLength={14}
            autoFocus
            style={{
              flex: 1,
              fontSize: 22, // MODIFIED: phone input text bumped +4pt (was ~18pt)
              fontWeight: "500",
              color: COLORS.gray[900],
              borderBottomWidth: 2,
              borderBottomColor: rawDigits ? COLORS.primary[600] : COLORS.gray[300],
              paddingBottom: 8,
            }}
          />
        </View>

        {/* Error text */}
        {error && (
          // MODIFIED: increased error text from ~14pt to 16pt
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
          We'll text you a code to verify your number
        </Text>
      </View>

      {/* Send Code button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={handleSend}
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
              Send Code
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
