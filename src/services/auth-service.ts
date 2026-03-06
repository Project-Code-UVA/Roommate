/**
 * Auth service: age validation, phone OTP, user record management.
 *
 * Client-side age check is a convenience pre-check.
 * Server enforces via validate_age() trigger on users table.
 */

import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const DEV_MODE = __DEV__;

/**
 * Client-side age validation. Returns true if birthdate is 18+ years ago.
 * Server-side trigger enforces this as well.
 */
export function validateAge(birthdate: Date): boolean {
  const today = new Date();
  const eighteenYearsAgo = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );

  return birthdate <= eighteenYearsAgo;
}

/**
 * Send OTP code to phone number via Supabase Auth.
 * Prepends +1 country code for US numbers.
 */
export async function sendOtp(
  phone: string,
): Promise<{ error: string | null }> {
  if (DEV_MODE) {
    // Skip actual SMS in dev — any 6-digit code will work in verifyOtp
    return { error: null };
  }

  const formattedPhone = phone.startsWith("+") ? phone : `+1${phone}`;

  const { error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
  });

  return { error: error?.message ?? null };
}

/**
 * Verify OTP code and establish session.
 */
export async function verifyOtp(
  phone: string,
  token: string,
): Promise<{ session: Session | null; error: string | null }> {
  if (DEV_MODE) {
    // Dev bypass — sign in with a dev email to get a real session
    // This lets you test the full onboarding flow without SMS
    const devEmail = `dev-${phone}@room-dev.local`;
    const devPassword = "dev-password-123";

    // Try sign in first, then sign up if user doesn't exist
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: devEmail,
        password: devPassword,
      });

    if (signInData?.session) {
      return { session: signInData.session, error: null };
    }

    // User doesn't exist — sign up
    if (signInError) {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: devEmail,
          password: devPassword,
        });

      if (signUpError) {
        return { session: null, error: signUpError.message };
      }

      return { session: signUpData?.session ?? null, error: null };
    }

    return { session: null, error: "Dev auth failed" };
  }

  const formattedPhone = phone.startsWith("+") ? phone : `+1${phone}`;

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: "sms",
  });

  return {
    session: data?.session ?? null,
    error: error?.message ?? null,
  };
}

/**
 * Create a user record in the users table after successful auth.
 * Server-side trigger validates age via birthdate.
 */
export async function createUserRecord(
  userId: string,
  birthdate: string,
  phone: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from("users").upsert(
    { id: userId, birthdate, phone },
    { onConflict: "id" },
  );

  return { error: error?.message ?? null };
}

/**
 * Mark onboarding as complete for a user.
 * Called after the final onboarding step (bio).
 */
export async function markOnboardingComplete(
  userId: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", userId);

  return { error: error?.message ?? null };
}
