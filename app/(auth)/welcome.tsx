import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
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
    } catch (e: any) {
      Alert.alert("Sign-in failed", e.message ?? "Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <LinearGradient
      colors={["#111827", "#4c1d95", "#5b21b6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.inner}>
          {/* Logo / branding area */}
          <View style={styles.brandingArea}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>R</Text>
            </View>
            <Text style={styles.logoText}>Room</Text>
            <Text style={styles.tagline}>Find your perfect roommate</Text>
          </View>

          {/* Primary action buttons */}
          <View style={styles.buttonGroup}>
            {/* Log In */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              disabled={loading !== null}
              activeOpacity={0.85}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>

            {/* Sign Up */}
            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              disabled={loading !== null}
              activeOpacity={0.85}
              style={styles.signUpButton}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* "or" divider */}
          <View style={styles.divider}>
            <Text style={styles.dividerText}>or</Text>
          </View>

          {/* OAuth icon row */}
          <View style={styles.oauthRow}>
            {/* Google */}
            <TouchableOpacity
              onPress={() => handleOAuth("google")}
              disabled={loading !== null}
              activeOpacity={0.85}
              style={styles.oauthButton}
            >
              {loading === "google" ? (
                <ActivityIndicator size="small" color={COLORS.gray[500]} />
              ) : (
                <Ionicons name="logo-google" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>

            {/* Microsoft */}
            <TouchableOpacity
              onPress={() => handleOAuth("azure")}
              disabled={loading !== null}
              activeOpacity={0.85}
              style={styles.oauthButton}
            >
              {loading === "microsoft" ? (
                <ActivityIndicator size="small" color={COLORS.gray[500]} />
              ) : (
                <Ionicons name="logo-microsoft" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
            You must be 18+ to use Room.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, justifyContent: "space-between" },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  brandingArea: { alignItems: "center", marginBottom: 48 },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: COLORS.primary[600],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconText: { fontSize: 36, color: "#ffffff", fontWeight: "700" },
  logoText: { fontSize: 36, fontWeight: "800", color: "#ffffff", lineHeight: 44 },
  tagline: { fontSize: 18, color: "#d1d5db", marginTop: 8 },
  buttonGroup: { gap: 14 },
  loginButton: {
    backgroundColor: COLORS.primary[600],
    borderRadius: 999,
    paddingVertical: 16,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  signUpButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 16,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
  divider: { alignItems: "center", marginVertical: 24 },
  dividerText: { fontSize: 13, color: "#9ca3af" },
  oauthRow: { flexDirection: "row", justifyContent: "center", gap: 24 },
  oauthButton: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  footer: { paddingHorizontal: 24, paddingBottom: 24 },
  footerText: { fontSize: 13, color: "#9ca3af", textAlign: "center" },
});
