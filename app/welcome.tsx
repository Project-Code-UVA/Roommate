/**
 * Welcome / landing screen.
 *
 * Hinge-style design with dark gradient background, Room branding,
 * legal text, "Get Started -->" CTA, and "Sign in" link.
 */

import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 56, fontWeight: "800", color: "#ffffff" },
  tagline: { marginTop: 12, fontSize: 18, color: "#d1d5db" },
  ctaArea: { width: "100%", alignItems: "center" },
  legalText: {
    marginBottom: 16,
    paddingHorizontal: 16,
    textAlign: "center",
    fontSize: 12,
    color: "#9ca3af",
  },
  button: {
    width: "100%",
    borderRadius: 9999,
    backgroundColor: "#9333ea",
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  signInButton: { marginTop: 16, paddingVertical: 8 },
  signInText: {
    fontSize: 16,
    color: "#c4b5fd",
    textDecorationLine: "underline",
  },
});

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#111827", "#4c1d95", "#5b21b6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoText} testID="welcome-logo">Room</Text>
          <Text style={styles.tagline}>Find your perfect roommate</Text>
        </View>

        {/* CTA area */}
        <View style={styles.ctaArea}>
          <Text style={styles.legalText}>
            By tapping Get Started, you agree to our Terms of Service and
            Privacy Policy
          </Text>

          <Pressable
            onPress={() => router.push("/(auth)/birthday")}
            style={styles.button}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            testID="welcome-get-started"
          >
            <Text style={styles.buttonText}>{"Get Started -->"}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/phone")}
            style={styles.signInButton}
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            testID="welcome-sign-in"
          >
            <Text style={styles.signInText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
