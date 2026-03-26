/**
 * Your Status sub-page — roommate / friends / found-roommate picker.
 */

import { useCallback, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ModeSelector } from "@/components/profile/mode-selector";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";

export default function StatusScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const { modeStatus, isLoading } = useProfile(userId);
  const [modeState, setModeState] = useState(modeStatus);

  // Sync once loaded
  const handleModeChange = useCallback((mode: "roommate" | "friends" | "found_roommate") => {
    setModeState(mode);
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Your Status",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          headerTintColor: COLORS.primary[600],
        }}
      />
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
        </View>
      ) : (
        <View style={styles.content}>
          <ModeSelector
            userId={userId}
            currentMode={modeState}
            onModeChange={handleModeChange}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingTop: 20 },
});
