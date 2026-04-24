/**
 * Test stubs for auth service.
 * Covers: AUTH-01 (age validation), AUTH-02 (OTP), AUTH-06 (onboarding completion).
 */

describe("auth-service", () => {
  describe("age validation", () => {
    it.todo("returns true for user exactly 17 years old");
    it.todo("returns true for user over 17");
    it.todo("returns false for user under 17");
    it.todo("returns false for user one day before 17th birthday");
  });

  describe("otp", () => {
    it.todo("sendOtp calls supabase.auth.signInWithOtp with formatted phone");
    it.todo("sendOtp returns error message on failure");
    it.todo("verifyOtp returns session on success");
    it.todo("verifyOtp returns error on invalid code");
  });

  describe("onboarding completion", () => {
    it.todo("createUserRecord inserts into users table");
    it.todo("markOnboardingComplete sets onboarding_completed to true");
  });
});
