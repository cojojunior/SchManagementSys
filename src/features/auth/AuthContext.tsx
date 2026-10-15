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
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeLocalPart(email: string | undefined): string | null {
  if (!email) return null;
  const local = email.split("@")[0];
  if (!local) return null;
  if (UUID_RE.test(local)) return null;
  return local;
}

function sessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const user = session.user;
  const meta = user.app_metadata ?? {};
  const role = (meta.role as Role) ?? "student";
  const fromMeta = user.user_metadata?.full_name as string | undefined;
  const fromEmail = safeLocalPart(user.email);
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: fromMeta ?? fromEmail ?? "",
    role,
    studentId: meta.student_id as string | undefined,
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

async function enrichUser(base: AuthUser): Promise<AuthUser> {
  const profile = await loadProfile(base.id);
  if (!profile) return base;
  return {
    ...base,
    fullName: profile.fullName || base.fullName,
    role: profile.role || base.role,
    studentId: profile.studentId || base.studentId,
    mustChangePassword: profile.mustChangePassword,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      const base = sessionToUser(data.session);
      if (!base) {
        setUser(null);
        setLoading(false);
        return;
      }
      const enriched = await enrichUser(base);
      if (!cancelled) {
        setUser(enriched);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      const base = sessionToUser(session);
      if (!base) {
        setUser(null);
        return;
      }
      const enriched = await enrichUser(base);
      if (!cancelled) setUser(enriched);
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
          email: email.trim().toLowerCase(),
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
      async refreshUser() {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        const base = sessionToUser(data.session);
        if (!base) {
          setUser(null);
          return;
        }
        const enriched = await enrichUser(base);
        setUser(enriched);
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
