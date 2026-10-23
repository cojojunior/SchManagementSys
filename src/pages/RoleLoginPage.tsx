import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Crown,
  BookOpen,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { supabase } from "@/lib/supabase";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { cn } from "@/lib/cn";

const ROLE_CONFIG: Record<
  Role,
  { title: string; subtitle: string; icon: any; theme: string; button: string }
> = {
  super_admin: {
    title: "System Administrator",
    subtitle: "Restricted Access",
    icon: ShieldCheck,
    theme: "bg-slate-900 text-white",
    button: "bg-indigo-600 hover:bg-indigo-700 text-white",
  },
  headmaster: {
    title: "Headmaster Portal",
    subtitle: "Review & publish results",
    icon: Crown,
    theme: "bg-amber-50",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  teacher: {
    title: "Teacher Portal",
    subtitle: "Enter marks & remarks",
    icon: BookOpen,
    theme: "bg-sky-50",
    button: "bg-sky-600 hover:bg-sky-700 text-white",
  },
  secretary: {
    title: "Secretary Portal",
    subtitle: "Records & finances",
    icon: FileText,
    theme: "bg-emerald-50",
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  student: {
    title: "Student Portal",
    subtitle: "View results & fees",
    icon: GraduationCap,
    theme: "bg-brand-50",
    button: "bg-brand-600 hover:bg-brand-700 text-white",
  },
};

export default function RoleLoginPage({
  expectedRole,
}: {
  expectedRole: Role;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const config = ROLE_CONFIG[expectedRole];
  const isDark = expectedRole === "super_admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Supabase not configured.");

      await supabase.auth.signOut();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError || !data.user) {
        setError("Invalid email or password.");
        return;
      }

      const actualRole = data.user.app_metadata?.role as Role | undefined;

      if (actualRole !== expectedRole) {
        await supabase.auth.signOut();
        setError(
          `Unauthorized. You are trying to log in to the ${expectedRole.replace("_", " ")} portal, but your account is not configured for this role.`,
        );
        return;
      }

      navigate(ROLE_HOME[actualRole] ?? "/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div
      className={cn("min-h-screen grid place-items-center p-4", config.theme)}>
      <Card
        className={cn(
          "w-full max-w-md",
          isDark && "bg-slate-800 border-slate-700",
        )}>
        <CardBody className="space-y-6 p-8">
          <div className="text-center">
            <div
              className={cn(
                "mx-auto h-20 w-20 rounded-full grid place-items-center shadow-sm overflow-hidden p-1 mb-4",
                isDark ? "bg-white" : "bg-white border border-ink-100",
              )}>
              <img
                src="/SUAC-LOGO.svg"
                alt="Supreme Academy"
                className="h-full w-full object-contain"
              />
            </div>
            <h1
              className={cn(
                "text-xl font-bold",
                isDark ? "text-white" : "text-ink-900",
              )}>
              {config.title}
            </h1>
            <p
              className={cn(
                "text-sm mt-1",
                isDark ? "text-slate-400" : "text-ink-500",
              )}>
              {config.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              required
              className={isDark ? "[&_label]:text-slate-300" : ""}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={
                  isDark ? "bg-slate-900 border-slate-700 text-white" : ""
                }
                autoComplete="username"
              />
            </FormField>

            <FormField
              label="Password"
              required
              className={isDark ? "[&_label]:text-slate-300" : ""}>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={
                  isDark ? "bg-slate-900 border-slate-700 text-white" : ""
                }
                autoComplete="current-password"
              />
            </FormField>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className={cn("w-full", config.button)}
              size="lg"
              disabled={working || !email || !password}>
              {working ? "Authenticating…" : "Sign in"}
            </Button>
          </form>

          <div className="text-center pt-2 flex flex-col gap-2">
            {expectedRole !== "super_admin" && (
              <Link
                to="/forgot-password"
                className={cn(
                  "text-sm hover:underline",
                  isDark ? "text-slate-400" : "text-brand-600",
                )}>
                Forgot password?
              </Link>
            )}
            <Link
              to="/"
              className={cn(
                "text-xs inline-flex items-center justify-center gap-1",
                isDark
                  ? "text-slate-500 hover:text-slate-300"
                  : "text-ink-500 hover:text-ink-700",
              )}>
              <ArrowLeft className="h-3 w-3" /> Back to portal selection
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
