import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, loading, onboarded } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "(auth)";

    if (!session) {
      // Not signed in → send to welcome/sign-in
      if (!inAuthGroup) {
        router.replace("/(auth)/welcome");
      }
    } else if (!onboarded) {
      // Signed in but hasn't completed onboarding → sign out and send to welcome
      supabase.auth.signOut();
    } else {
      // Signed in and onboarded → send to main app
      if (inAuthGroup) {
        router.replace("/(tabs)");
      }
    }
  }, [session, loading, onboarded, segments]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
