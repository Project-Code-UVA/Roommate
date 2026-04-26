/**
 * Settings — "Looking for" (roommate preferences).
 *
 * Reuses NittyGrittyMultiEditor with primary theme. Saves and returns.
 */

import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";

import {
  NittyGrittyMultiEditor,
  type MultiSelections,
} from "@/components/profile/nitty-gritty-multi-editor";
import { useSession } from "@/contexts/auth-context";
import { getNittyGritty } from "@/services/filter-service";
import { updateProfile } from "@/services/profile-service";
import { COLORS } from "@/lib/constants";
import type { Json } from "@/types/database.types";
import type { NittyGritty } from "@/types/filters";

export default function PreferencesSettingsScreen() {
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const [initial, setInitial] = useState<MultiSelections | null>(null);
  const [existing, setExisting] = useState<NittyGritty | null>(null);

  useEffect(() => {
    if (!userId) return;
    void (async () => {
      const result = await getNittyGritty(userId);
      const ng = result.data ?? { self: {}, preferences: {} };
      setExisting(ng);
      setInitial(ng.preferences ?? {});
    })();
  }, [userId]);

  const handleSave = useCallback(
    async (selections: MultiSelections) => {
      if (!userId || !existing) return;
      const next = {
        self: existing.self,
        preferences: selections,
      };
      const result = await updateProfile(userId, {
        nitty_gritty: next as unknown as Json,
      });
      if (result.error) {
        Alert.alert("Error", `Failed to save: ${result.error}`);
        return;
      }
      router.back();
    },
    [userId, existing, router],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Looking for",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          headerTintColor: COLORS.primary[600],
        }}
      />
      {initial === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary[500]} />
        </View>
      ) : (
        <NittyGrittyMultiEditor
          title="Looking for"
          subtitle="Qualities you'd love in a future roommate. Pick any that apply."
          initial={initial}
          actionLabel="Save"
          onSave={handleSave}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
});
