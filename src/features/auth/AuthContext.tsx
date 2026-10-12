import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { AuthUser } from "./types";
import type { Role } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; reason?: string }>;
  signOut: () => Promise<void>;
  /** Only for the current demo/dev flow. Real auth is via signIn. */
  signInAsDemo: (role: Role) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USERS: Record<Role, AuthUser> = {
  super_admin: {
    id: "demo-admin",
    email: "admin@supreme.edu.gh",
    fullName: "Kwame Mensah",
    role: "super_admin",
  },
  headmaster: {
    id: "demo-head",
    email: "head@supreme.edu.gh",
    fullName: "Akosua Boateng",
    role: "headmaster",
  },
  teacher: {
    id: "demo-teach",
    email: "teacher@supreme.edu.gh",
    fullName: "Yaw Owusu",
    role: "teacher",
  },
  secretary: {
    id: "demo-sec",
    email: "sec@supreme.edu.gh",
    fullName: "Abena Asante",
    role: "secretary",
  },
  student: {
    id: "demo-stu",
    email: "kofi.adjei@supreme.edu.gh",
    fullName: "Kofi Adjei",
    role: "student",
    studentId: "demo-stu-001",
  },
};

/**
 * Map a Supabase session → AuthUser.
 * Reads role from app_metadata (server-set, not user-editable).
 */
function sessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const user = session.user;
  const meta = user.app_metadata ?? {};
  const role = (meta.role as Role) ?? "student";
  return {
    id: user.id,
    email: user.email ?? "",
    fullName:
      user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
    role,
    studentId: meta.student_id as string | undefined,
    // Populated separately from profiles table
    mustChangePassword: false,
  };
}

async function loadProfile(userId: string): Promise<{
  fullName: string;
  role: Role;
  studentId?: string;
  mustChangePassword: boolean;
} | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, role, student_id, must_change_password")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    fullName: data.full_name,
    role: data.role as Role,
    studentId: data.student_id ?? undefined,
    mustChangePassword: data.must_change_password ?? false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to Supabase auth state
  useEffect(() => {
    if (!supabase) {
      // Supabase not configured — fall back to demo mode
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Initial session read
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setUser(sessionToUser(data.session));
      setLoading(false);
    });

    // Live updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session));
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signIn(email, password) {
        if (!supabase) {
          return { ok: false, reason: "Supabase is not configured." };
        }
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          return { ok: false, reason: "Invalid email or password." };
        }
        return { ok: true };
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
      },
      signInAsDemo(role) {
        setUser(DEMO_USERS[role]);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
