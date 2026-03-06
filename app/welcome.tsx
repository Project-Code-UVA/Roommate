/**
 * Welcome / landing screen.
 *
 * Hinge-style design with dark gradient background, Room branding,
 * legal text, "Get Started -->" CTA, and "Sign in" link.
 */

import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#111827", "#4c1d95", "#5b21b6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 items-center justify-between px-6 py-12">
        {/* Logo area */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl font-bold text-white">Room</Text>
          <Text className="mt-3 text-lg text-gray-300">
            Find your perfect roommate
          </Text>
        </View>

        {/* CTA area */}
        <View className="w-full items-center">
          <Text className="mb-4 px-4 text-center text-xs text-gray-400">
            By tapping Get Started, you agree to our Terms of Service and
            Privacy Policy
          </Text>

          <Pressable
            onPress={() => router.push("/(auth)/birthday")}
            className="w-full rounded-full bg-purple-600 px-8 py-4"
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <Text className="text-center text-lg font-semibold text-white">
              {"Get Started -->"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/phone")}
            className="mt-4 py-2"
            accessibilityRole="link"
            accessibilityLabel="Sign in"
          >
            <Text className="text-base text-purple-300 underline">
              Sign in
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
