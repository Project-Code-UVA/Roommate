/**
 * Settings screen route — account management, privacy, notifications.
 */

import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { SettingsScreen } from "@/components/settings/settings-screen";
import { COLORS } from "@/lib/constants";

export default function Settings() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Settings",
          headerStyle: { backgroundColor: "#f5f5f5" },
          headerTintColor: COLORS.gray[800],
        }}
      />
      <SettingsScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
