import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export default function WelcomeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<"google" | "microsoft" | null>(null);

  async function handleOAuth(provider: "google" | "azure") {
    const label = provider === "google" ? "google" : "microsoft";
    setLoading(label);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: "roommate://auth/callback",
        },
      });
      if (error) throw error;
      // The OAuth flow opens in the browser; on return the auth listener picks it up.
      // After OAuth, the root navigator will route to birthday (onboarding) if not onboarded.
    } catch (e: any) {
      Alert.alert("Sign-in failed", e.message ?? "Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 justify-center">
        {/* Logo / branding area */}
        <View className="items-center mb-12">
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: COLORS.primary[600],
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ fontSize: 36, color: COLORS.white, fontWeight: "700" }}>R</Text>
          </View>
          <Text
            style={{ fontSize: 36, lineHeight: 44 }}
            className="font-bold text-gray-900 text-center"
          >
            Room
          </Text>
          <Text
            style={{ fontSize: 18 }}
            className="text-gray-500 text-center mt-2"
          >
            Find your perfect roommate
          </Text>
        </View>

        {/* Primary action buttons */}
        <View style={{ gap: 14 }}>
          {/* Log In */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            disabled={loading !== null}
            activeOpacity={0.85}
            style={{
              backgroundColor: COLORS.primary[600],
              borderRadius: 999,
              paddingVertical: 16,
            }}
          >
            <Text
              style={{ fontSize: 18 }}
              className="text-white font-semibold text-center"
            >
              Log In
            </Text>
          </TouchableOpacity>

          {/* Sign Up */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/signup")}
            disabled={loading !== null}
            activeOpacity={0.85}
            style={{
              backgroundColor: COLORS.white,
              borderWidth: 2,
              borderColor: COLORS.primary[600],
              borderRadius: 999,
              paddingVertical: 16,
            }}
          >
            <Text
              style={{ fontSize: 18, color: COLORS.primary[600] }}
              className="font-semibold text-center"
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>

        {/* "or" divider */}
        <View className="items-center my-6">
          <Text style={{ fontSize: 13, color: COLORS.gray[400] }}>or</Text>
        </View>

        {/* OAuth icon row */}
        <View className="flex-row justify-center" style={{ gap: 24 }}>
          {/* Google */}
          <TouchableOpacity
            onPress={() => handleOAuth("google")}
            disabled={loading !== null}
            activeOpacity={0.85}
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: COLORS.gray[200],
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.white,
            }}
          >
            {loading === "google" ? (
              <ActivityIndicator size="small" color={COLORS.gray[500]} />
            ) : (
              <Ionicons name="logo-google" size={24} color="#4285F4" />
            )}
          </TouchableOpacity>

          {/* Microsoft */}
          <TouchableOpacity
            onPress={() => handleOAuth("azure")}
            disabled={loading !== null}
            activeOpacity={0.85}
            style={{
              width: 56,
              height: 56,
              borderRadius: 999,
              borderWidth: 1.5,
              borderColor: COLORS.gray[200],
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: COLORS.white,
            }}
          >
            {loading === "microsoft" ? (
              <ActivityIndicator size="small" color={COLORS.gray[500]} />
            ) : (
              <Ionicons name="logo-microsoft" size={24} color="#00A4EF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 pb-6">
        <Text
          style={{ fontSize: 13 }}
          className="text-gray-400 text-center"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
          You must be 18+ to use Room.
        </Text>
      </View>
    </SafeAreaView>
  );
}
