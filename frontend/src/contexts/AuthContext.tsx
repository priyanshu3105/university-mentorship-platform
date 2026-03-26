import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { apiGet } from "@/lib/api";
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

  const refreshProfile = async () => {
    const p = await fetchProfile();
    setProfile(p);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProfile().then((p) => {
        setProfile(p);
        setLoading(false);
      });
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [session]);

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
