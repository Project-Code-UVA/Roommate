/**
 * Welcome / landing screen.
 *
 * Placeholder with Room logo, "Get Started -->" button, and "Sign in" link.
 * Plan 02 will implement the full Hinge-style design with background image.
 */

import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#7c3aed", "#5b21b6", "#4c1d95"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 items-center justify-between px-6 py-12">
        {/* Logo area */}
        <View className="flex-1 items-center justify-center">
          <Text className="text-5xl font-bold text-white">Room</Text>
          <Text className="mt-3 text-lg text-white/80">
            Find your perfect roommate
          </Text>
        </View>

        {/* CTA area */}
        <View className="w-full items-center">
          <Pressable
            onPress={() => router.push("/(auth)/birthday")}
            className="w-full rounded-full bg-white py-4"
            accessibilityRole="button"
            accessibilityLabel="Get Started"
          >
            <Text className="text-center text-lg font-semibold text-primary-600">
              {"Get Started -->"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/phone")}
            className="mt-4 py-2"
            accessibilityRole="link"
            accessibilityLabel="Sign in"
          >
            <Text className="text-base text-white/80">Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
