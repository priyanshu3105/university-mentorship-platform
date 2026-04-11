import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { apiGet, apiPost } from "@/lib/api";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

export type Role = "student" | "mentor" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  profileExists: boolean;
  mentor: { isApproved: boolean } | null;
}

interface AuthState {
  session: Session | null;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function fetchProfile(): Promise<UserProfile | null> {
  try {
    const data = await apiGet("/auth/me");
    if (!data.profileExists) {
      return {
        id: data.id,
        email: data.email,
        fullName: "",
        role: "student",
        profileExists: false,
        mentor: null,
      };
    }
    return {
      id: data.id,
      email: data.email,
      fullName: data.profile.full_name,
      role: data.profile.role,
      profileExists: true,
      mentor: data.mentor,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  /** False until the first `getSession()` finishes — avoids treating the user as logged out while storage is still loading. */
  const [authInitialized, setAuthInitialized] = useState(false);

  const refreshProfile = async () => {
    const p = await fetchProfile();
    setProfile(p);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
      })
      .finally(() => {
        if (mounted) setAuthInitialized(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authInitialized) return;

    let cancelled = false;

    const syncProfile = async () => {
      if (!session) {
        if (!cancelled) {
          setProfile(null);
          setLoading(false);
        }
        return;
      }

      let p = await fetchProfile();

      // Email-verification flow may not return a session at sign-up time.
      // On first verified login, complete registration using stored metadata if present.
      if (p && !p.profileExists) {
        const metadataFullName =
          session.user?.user_metadata?.full_name ||
          session.user?.user_metadata?.fullName ||
          "";

        if (typeof metadataFullName === "string" && metadataFullName.trim()) {
          try {
            await apiPost("/auth/complete-registration", {
              fullName: metadataFullName.trim(),
            });
            p = await fetchProfile();
          } catch (err) {
            console.error("Auto-complete registration failed:", err);
          }
        }
      }

      if (!cancelled) {
        setProfile(p);
        setLoading(false);
      }
    };

    void syncProfile();

    return () => {
      cancelled = true;
    };
  }, [session, authInitialized]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
