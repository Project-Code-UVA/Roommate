/**
 * My Photos sub-page — photo grid manager.
 */

import { View, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { PhotoManager } from "@/components/profile/photo-manager";
import { useProfile } from "@/hooks/use-profile";
import { useSession } from "@/contexts/auth-context";
import { COLORS } from "@/lib/constants";

export default function PhotosScreen() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const { photos, isLoading, refresh } = useProfile(userId);

  return (
    <SafeAreaView style={styles.screen} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "My Photos",
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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PhotoManager userId={userId} photos={photos} onPhotosChanged={refresh} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 },
});
