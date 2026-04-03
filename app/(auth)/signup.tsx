import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { COLORS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { createUserRecord } from "@/services/auth-service";
import { useOnboarding } from "@/hooks/use-onboarding";

export default function SignupScreen() {
  const router = useRouter();
  const { getProgress } = useOnboarding();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleSignup = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;

      // Create users row immediately after auth signup.
      // Phone is nullable — it gets set later during OTP verification.
      const userId = data.user?.id;
      if (userId) {
        const progress = await getProgress();
        const birthdate = progress?.birthdate as string | undefined;
        if (birthdate) {
          await createUserRecord(userId, birthdate, "");
        }
      }

      router.replace("/(auth)/phone");
    } catch (e: any) {
      if (e.message?.includes("already registered")) {
        setError("An account with this email already exists. Try logging in.");
      } else {
        setError(e.message ?? "Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [isValid, email, password, getProgress]);

  return (
    <StepContainer
      title="Create your account"
      subtitle="Sign up with an email and password"
      showBack
      onBack={() => router.back()}
      currentStep={0}
      totalSteps={9}
    >
      <View className="flex-1">
        {/* Email */}
        <Text style={{ fontSize: 16, color: COLORS.gray[700], marginBottom: 6, marginTop: 8 }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={(t) => { setEmail(t); setError(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          placeholder="you@example.com"
          placeholderTextColor={COLORS.gray[400]}
          style={{
            fontSize: 18,
            color: COLORS.gray[900],
            borderBottomWidth: 2,
            borderBottomColor: email ? COLORS.primary[600] : COLORS.gray[300],
            paddingBottom: 8,
          }}
        />

        {/* Password */}
        <Text style={{ fontSize: 16, color: COLORS.gray[700], marginBottom: 6, marginTop: 24 }}>
          Password
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: password ? COLORS.primary[600] : COLORS.gray[300] }}>
          <TextInput
            value={password}
            onChangeText={(t) => { setPassword(t); setError(null); }}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            placeholder="At least 6 characters"
            placeholderTextColor={COLORS.gray[400]}
            style={{
              flex: 1,
              fontSize: 18,
              color: COLORS.gray[900],
              paddingBottom: 8,
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORS.gray[400]}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={{ fontSize: 16, color: COLORS.gray[700], marginBottom: 6, marginTop: 24 }}>
          Confirm Password
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 2, borderBottomColor: confirmPassword ? (confirmPassword === password ? COLORS.primary[600] : "#ef4444") : COLORS.gray[300] }}>
          <TextInput
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setError(null); }}
            secureTextEntry={!showConfirm}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            placeholderTextColor={COLORS.gray[400]}
            style={{
              flex: 1,
              fontSize: 18,
              color: COLORS.gray[900],
              paddingBottom: 8,
            }}
          />
          <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={COLORS.gray[400]}
            />
          </TouchableOpacity>
        </View>

        {confirmPassword.length > 0 && confirmPassword !== password && (
          <Text style={{ fontSize: 14, color: "#ef4444", marginTop: 4 }}>
            Passwords don't match
          </Text>
        )}

        {error && (
          <Text style={{ fontSize: 16 }} className="text-red-500 mt-3">
            {error}
          </Text>
        )}
      </View>

      {/* Sign Up button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={handleSignup}
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
              Sign Up
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
