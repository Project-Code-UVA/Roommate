/**
 * OTP verification screen.
 *
 * Displays a 6-box OTP input with auto-advance and paste support.
 * On successful verification, creates the user record and navigates
 * to the next onboarding step.
 *
 * Includes a resend option with a 60-second countdown timer.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { StepContainer } from "@/components/onboarding/step-container";
import { OtpInput } from "@/components/onboarding/otp-input";
import { verifyOtp, sendOtp, createUserRecord } from "@/services/auth-service";
import { supabase } from "@/lib/supabase";
import { useOnboarding } from "@/hooks/use-onboarding";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";

const RESEND_COOLDOWN_SECONDS = 60;

/** Format raw digits as (xxx) xxx-xxxx for display. */
function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { saveProgress, getProgress } = useOnboarding();
  const { refreshOnboardingStatus } = useSession();

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [otpKey, setOtpKey] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown timer on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
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
      if (isVerifying || !phone) return;

      setIsVerifying(true);
      setErrorMessage(null);

      try {
        const { session, error } = await verifyOtp(phone, code);

        if (error || !session) {
          setErrorMessage(error ?? "Verification failed. Please try again.");
          setOtpKey((prev) => prev + 1);
          setIsVerifying(false);
          return;
        }

        // Retrieve birthdate from saved progress
        const progress = await getProgress();
        const birthdate = progress?.birthdate as string | undefined;

        if (birthdate) {
          const { error: createError } = await createUserRecord(
            session.user.id,
            birthdate,
            phone,
          );

          if (createError) {
            // Sign out to prevent a live session with no users row
            await supabase.auth.signOut();
            setErrorMessage("Could not create your account. Please try again.");
            setIsVerifying(false);
            return;
          }
        }

        await saveProgress("verify-otp", { verified: true });

        // Check if returning user (already completed onboarding)
        await refreshOnboardingStatus();
        // The auth context redirect in tab layout will handle routing.
        // Only push to name screen for new users (no birthdate = signup flow).
        if (!birthdate) {
          // Returning user via Sign In — let auth context handle redirect
          router.replace("/(tabs)");
        } else {
          router.push("/(auth)/name");
        }
      } catch {
        setErrorMessage("Something went wrong. Please try again.");
        setOtpKey((prev) => prev + 1);
      } finally {
        setIsVerifying(false);
      }
    },
    [isVerifying, phone, getProgress, saveProgress, refreshOnboardingStatus, router],
  );

  async function handleResend() {
    if (resendCountdown > 0 || !phone) return;

    const { error } = await sendOtp(phone);
    if (error) {
      setErrorMessage(error);
      return;
    }

    // Restart countdown
    setResendCountdown(RESEND_COOLDOWN_SECONDS);
    setErrorMessage(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleBack() {
    router.back();
  }

  const displayPhone = phone ? `+1 ${formatPhoneDisplay(phone)}` : "";

  return (
    <StepContainer
      title="Enter verification code"
      subtitle={`Code sent to ${displayPhone}`}
      onBack={handleBack}
    >
      <View className="mt-8 items-center">
        {/* OTP Input */}
        <OtpInput key={otpKey} onComplete={handleComplete} />

        {/* Loading indicator */}
        {isVerifying ? (
          <ActivityIndicator
            className="mt-6"
            size="large"
            color={COLORS.primary[600]}
          />
        ) : null}

        {/* Error message */}
        {errorMessage ? (
          <Text className="mt-4 text-center text-sm text-red-500">
            {errorMessage}
          </Text>
        ) : null}

        {/* Resend section */}
        <View className="mt-8 items-center">
          <Text className="text-sm text-gray-500">
            Didn't get the code?
          </Text>

          <Pressable
            onPress={handleResend}
            disabled={resendCountdown > 0}
            className="mt-2"
            accessibilityRole="button"
            testID="otp-resend"
            accessibilityLabel={
              resendCountdown > 0
                ? `Resend in ${resendCountdown} seconds`
                : "Resend code"
            }
          >
            <Text
              className={`text-base font-semibold ${
                resendCountdown > 0 ? "text-gray-400" : "text-primary-600"
              }`}
            >
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : "Resend"}
            </Text>
          </Pressable>
        </View>
      </View>
    </StepContainer>
  );
}
