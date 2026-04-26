import "../global.css";

import { useCallback, useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { SessionProvider, useSession } from "@/contexts/auth-context";
import { useNotifications } from "@/hooks/use-notifications";
import { useEnforcement } from "@/hooks/use-enforcement";
import { EnforcementModal } from "@/components/safety/enforcement-modal";
import { BanScreen } from "@/components/safety/ban-screen";
import { signOut } from "@/services/account-service";

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { session } = useSession();
  useNotifications(session?.user.id);

  // Enforcement state check on mount
  const { enforcementInfo, showWarningModal, dismissWarning } = useEnforcement(
    session?.user.id,
  );

  // Suspension modal -- show once on mount
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);

  useEffect(() => {
    if (enforcementInfo?.state === "suspended_7d") {
      setShowSuspensionModal(true);
    }
  }, [enforcementInfo?.state]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  // Permanent ban: replace entire app (D-08)
  if (enforcementInfo?.state === "permanent_ban") {
    return <BanScreen onSignOut={handleSignOut} />;
  }

  return (
    <BottomSheetModalProvider>
      <Stack
        screenOptions={{
          headerBackTitle: "",
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: "#fff" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: true, presentation: "card" }} />
        <Stack.Screen name="profile/edit" options={{ headerShown: true, presentation: "card" }} />
        <Stack.Screen name="profile/photos" options={{ headerShown: true, presentation: "card" }} />
        <Stack.Screen name="profile/status" options={{ headerShown: true, presentation: "card" }} />
        <Stack.Screen name="profile/preferences" options={{ headerShown: true, presentation: "card" }} />
        <Stack.Screen name="profile/dealbreakers" options={{ headerShown: true, presentation: "card" }} />
        <Stack.Screen name="filters" options={{ headerShown: false, presentation: "card" }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />

      {/* Warning modal -- shown on app open (D-07) */}
      <EnforcementModal
        variant="warning"
        endDate={null}
        visible={showWarningModal}
        onDismiss={dismissWarning}
      />

      {/* Suspension modal -- shown once on app open */}
      <EnforcementModal
        variant="suspension"
        endDate={enforcementInfo?.endAt ?? null}
        visible={showSuspensionModal}
        onDismiss={() => setShowSuspensionModal(false)}
      />
    </BottomSheetModalProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
