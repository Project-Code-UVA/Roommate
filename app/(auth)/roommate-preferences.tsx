import { useCallback } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useSession } from "@/contexts/auth-context";
import { useOnboarding } from "@/hooks/use-onboarding";
import { getNittyGritty } from "@/services/filter-service";
import { updateProfile } from "@/services/profile-service";
import { markOnboardingComplete } from "@/services/auth-service";
import {
  NittyGrittyMultiEditor,
  type MultiSelections,
} from "@/components/profile/nitty-gritty-multi-editor";
import type { Json } from "@/types/database.types";

const TOTAL_STEPS = 11;
const CURRENT_STEP = 10;

export default function RoommatePreferencesScreen() {
  const router = useRouter();
  const { session, refreshOnboardingStatus } = useSession();
  const { clearProgress } = useOnboarding();
  const userId = session?.user.id ?? "";

  const handleSave = useCallback(
    async (selections: MultiSelections) => {
      if (!userId) return;
      const current = await getNittyGritty(userId);
      const existing = current.data ?? { self: {}, preferences: {} };

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

      const complete = await markOnboardingComplete(userId);
      if (complete.error) {
        Alert.alert("Error", `Failed to complete profile: ${complete.error}`);
        return;
      }

      await Promise.all([refreshOnboardingStatus(), clearProgress()]);
      router.replace("/(tabs)");
    },
    [userId, refreshOnboardingStatus, clearProgress, router],
  );

  return (
    <NittyGrittyMultiEditor
      title="Looking for"
      subtitle="Select the qualities you'd love in a future roommate. Pick as many as you want, per category."
      initial={{}}
      actionLabel="Finish"
      skipLabel="Skip and finish"
      progress={{ current: CURRENT_STEP, total: TOTAL_STEPS }}
      onBack={() => router.back()}
      onSave={handleSave}
    />
  );
}
