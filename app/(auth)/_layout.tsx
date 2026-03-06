/**
 * Auth/onboarding layout with progress bar.
 *
 * Stack navigator for onboarding step screens.
 * Renders ProgressBar at top based on current route.
 */

import { View } from "react-native";
import { Stack, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProgressBar } from "@/components/onboarding/progress-bar";

/**
 * Maps route name to visible progress step index.
 * verify-otp shares the phone step segment visually.
 */
const ROUTE_TO_STEP: Record<string, number> = {
  birthday: 0,
  phone: 1,
  "verify-otp": 1,
  name: 2,
  gender: 3,
  school: 4,
  photos: 5,
  bio: 6,
};

function getStepFromPathname(pathname: string): number {
  const segments = pathname.split("/");
  const routeName = segments[segments.length - 1] ?? "";
  return ROUTE_TO_STEP[routeName] ?? 0;
}

export default function AuthLayout() {
  const pathname = usePathname();
  const currentStep = getStepFromPathname(pathname);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1">
        <ProgressBar currentStep={currentStep} totalSteps={7} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="birthday" />
          <Stack.Screen name="phone" />
          <Stack.Screen name="verify-otp" />
          <Stack.Screen name="name" />
          <Stack.Screen name="gender" />
          <Stack.Screen name="school" />
          <Stack.Screen name="photos" />
          <Stack.Screen name="bio" />
        </Stack>
      </View>
    </SafeAreaView>
  );
}
