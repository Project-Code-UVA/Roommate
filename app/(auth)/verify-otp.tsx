import { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { OtpInput } from "@/components/onboarding/otp-input";
import { COLORS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

/** Format raw 10-digit string as (xxx) xxx-xxxx */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

const RESEND_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleComplete = useCallback(
    async (code: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error } = await supabase.auth.verifyOtp({
          phone: `+1${phone}`,
          token: code,
          type: "sms",
        });
        if (error) throw error;

        // Auth state change will be picked up by AuthProvider.
        // Navigate to next onboarding step.
        router.push("/(auth)/name");
      } catch {
        setError("Invalid code. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [phone, router],
  );

  const handleResend = useCallback(async () => {
    if (resendTimer > 0) return;

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+1${phone}`,
      });
      if (error) throw error;
      setResendTimer(RESEND_SECONDS);
      // Restart countdown
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Failed to resend code.");
    }
  }, [resendTimer, phone]);

  return (
    <StepContainer
      title="Enter verification code"
      subtitle={`Code sent to +1 ${formatPhone(phone ?? "")}`}
      showBack
      onBack={() => router.back()}
      currentStep={3}
      totalSteps={9}
    >
      <View className="flex-1">
        {/* OTP boxes */}
        <View className="mt-8">
          <OtpInput onComplete={handleComplete} length={6} />
        </View>

        {/* Loading indicator */}
        {loading && (
          <View className="mt-6 items-center">
            <ActivityIndicator size="large" color={COLORS.primary[600]} />
          </View>
        )}

        {/* Error text */}
        {error && (
          // MODIFIED: increased error text from ~14pt to 16pt
          <Text
            style={{ fontSize: 16 }} // MODIFIED: error text bumped +2pt
            className="text-red-500 text-center mt-4"
          >
            {error}
          </Text>
        )}

        {/* Resend section */}
        <View className="mt-8 items-center">
          {/* // MODIFIED: increased helper label from ~14pt to 16pt */}
          <Text
            style={{ fontSize: 16 }} // MODIFIED: helper text bumped +2pt
            className="text-gray-500"
          >
            Didn't get the code?
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendTimer > 0}
            className="mt-2"
          >
            {/* // MODIFIED: increased resend text from ~16pt to 18pt */}
            <Text
              style={{ fontSize: 18 }} // MODIFIED: resend link text bumped +2pt
              className={resendTimer > 0 ? "text-gray-400" : "text-primary-600 font-semibold"}
            >
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Verify button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={() => {}}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: COLORS.primary[600],
            borderRadius: 999, // MODIFIED: fully rounded pill shape
            paddingVertical: 18,
          }}
        >
          {/* // MODIFIED: increased button text from ~18pt to 20pt */}
          <Text
            style={{ fontSize: 20 }} // MODIFIED: button text bumped +2pt for larger scale
            className="text-white font-semibold text-center"
          >
            Verify
          </Text>
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
