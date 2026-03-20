import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  /** Whether the user has completed onboarding (has a profile row). */
  onboarded: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  loading: true,
  onboarded: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkOnboarded(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        checkOnboarded(session.user.id);
      } else {
        setOnboarded(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkOnboarded(userId: string) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      setOnboarded(!!data);
    } catch {
      setOnboarded(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        onboarded,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
