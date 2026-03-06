/**
 * Auth context providing session state and onboarding completion status.
 *
 * Uses Supabase Auth for session management. Checks `users.onboarding_completed`
 * to determine whether the user should be routed to onboarding or main app.
 *
 * Keeps splash screen visible until initial session check completes.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import * as SplashScreen from "expo-splash-screen";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

type AuthContextType = {
  readonly session: Session | null;
  readonly isLoading: boolean;
  readonly onboardingComplete: boolean;
  readonly refreshOnboardingStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  isLoading: true,
  onboardingComplete: false,
  refreshOnboardingStatus: async () => {},
});

export function useSession(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const checkOnboardingStatus = useCallback(
    async (userId: string): Promise<boolean> => {
      const { data, error } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", userId)
        .single();

      if (error || !data) {
        return false;
      }

      return data.onboarding_completed;
    },
    [],
  );

  const refreshOnboardingStatus = useCallback(async () => {
    if (!session?.user.id) return;

    const isComplete = await checkOnboardingStatus(session.user.id);
    setOnboardingComplete(isComplete);
  }, [session?.user.id, checkOnboardingStatus]);

  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(initialSession);

        if (initialSession?.user.id) {
          const isComplete = await checkOnboardingStatus(
            initialSession.user.id,
          );
          if (mounted) {
            setOnboardingComplete(isComplete);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          SplashScreen.hideAsync();
        }
      }
    }

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);

        if (newSession?.user.id) {
          checkOnboardingStatus(newSession.user.id).then((isComplete) => {
            if (mounted) {
              setOnboardingComplete(isComplete);
            }
          });
        } else {
          setOnboardingComplete(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkOnboardingStatus]);

  return (
    <AuthContext.Provider
      value={{ session, isLoading, onboardingComplete, refreshOnboardingStatus }}
    >
      {children}
    </AuthContext.Provider>
  );
}
