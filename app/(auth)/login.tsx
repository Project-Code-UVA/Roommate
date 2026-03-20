import { useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StepContainer } from "@/components/onboarding/step-container";
import { COLORS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isValid = email.includes("@") && password.length >= 6;

  const handleLogin = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      // Auth listener in context will handle navigation
    } catch (e: any) {
      if (e.message?.includes("Invalid login credentials")) {
        setError("Incorrect email or password.");
      } else {
        setError(e.message ?? "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [isValid, email, password]);

  return (
    <StepContainer
      title="Welcome back"
      subtitle="Log in with your email and password"
      showBack
      onBack={() => router.back()}
      currentStep={0}
      totalSteps={0}
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
            autoComplete="password"
            placeholder="••••••••"
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

        {error && (
          <Text style={{ fontSize: 16 }} className="text-red-500 mt-3">
            {error}
          </Text>
        )}
      </View>

      {/* Log In button */}
      <View className="pb-6 pt-4">
        <TouchableOpacity
          onPress={handleLogin}
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
              Log In
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </StepContainer>
  );
}
