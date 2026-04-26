/**
 * Auth convenience hook.
 *
 * Re-exports useSession for convenience and adds signOut method.
 */

import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useSession } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

export { useSession } from "@/contexts/auth-context";

export function useAuth() {
  const sessionContext = useSession();

  const signOut = useCallback(async (): Promise<{ error: string | null }> => {
    // Clear onboarding progress to prevent data leakage between accounts
    await AsyncStorage.removeItem("onboarding_progress");
    const { error } = await supabase.auth.signOut();
    return { error: error?.message ?? null };
  }, []);

  return {
    ...sessionContext,
    signOut,
  };
}
