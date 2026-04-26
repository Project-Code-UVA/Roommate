/**
 * Edit Profile sub-page — bio, year, gender, hometown.
 */

import { View, ActivityIndicator, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { ProfileFields } from "@/components/profile/profile-fields";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";
import type { NittyGritty } from "@/types/filters";

export default function EditProfileScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const { profile, isLoading, error, refresh, updateField } = useProfile(userId);

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Edit Profile",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          headerTintColor: COLORS.primary[600],
        }}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
        </View>
      ) : error || !profile ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? "Profile not found"}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ProfileFields
            bio={profile.bio}
            gender={profile.gender}
            showGender={profile.show_gender}
            hometown={profile.hometown}
            showHometown={profile.show_hometown}
            year={profile.year}
            nittyGritty={profile.nitty_gritty as NittyGritty | null}
            onUpdate={updateField}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 60 },
  errorText: { color: "#f87171", fontSize: 16, textAlign: "center", marginBottom: 16 },
  retryButton: { backgroundColor: COLORS.primary[600], borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
