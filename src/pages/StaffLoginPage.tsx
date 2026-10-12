import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogIn } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabase";
import { ROLE_HOME, type Role } from "@/lib/constants";

const STAFF_DOMAIN = "supremeacademy.edu.gh";

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      if (!supabase) {
        setError("Supabase not configured. Please contact the administrator.");
        return;
      }

      const trimmed = identifier.trim();

      // Two modes:
      //   - Super Admin signs in with a real email (contains "@")
      //   - Everyone else signs in with a Staff ID (HEAD001, TCH042, SEC003)
      let email: string;
      if (trimmed.includes("@")) {
        email = trimmed.toLowerCase();
      } else {
        const id = trimmed.toUpperCase();
        if (!/^(HEAD|TCH|SEC)\d{3,4}$/.test(id)) {
          setError(
            "Staff ID should look like HEAD001, TCH042, or SEC003. Super Admins sign in with their email.",
          );
          return;
        }
        email = `${id.toLowerCase()}@${STAFF_DOMAIN}`;
      }

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !data.user) {
        setError("Invalid credentials. Please check and try again.");
        return;
      }

      const role = data.user.app_metadata?.role as Role | undefined;
      if (!role) {
        setError(
          "This account isn't configured properly. Please contact the administrator.",
        );
        await supabase.auth.signOut();
        return;
      }

      navigate(ROLE_HOME[role] ?? "/", { replace: true });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-semibold">Staff Sign In</h1>
            <p className="text-sm text-ink-500 mt-1">
              Use your Staff ID, or your email if you&apos;re a Super Admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Staff ID or Email"
              required
              hint="e.g. HEAD001, TCH042, SEC003 — or your email">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="HEAD001"
                autoComplete="username"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="font-mono"
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="w-full"
              size="lg"
              disabled={working || !identifier || !password}>
              {working ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm text-ink-500 pt-4 border-t border-ink-200">
            Are you a student?{" "}
            <Link
              to="/student/login"
              className="text-brand-600 hover:underline">
              Student sign in
            </Link>
          </div>
          <div className="text-center">
            <Link
              to="/"
              className="text-xs text-ink-500 inline-flex items-center gap-1 hover:text-ink-700">
              <ArrowLeft className="h-3 w-3" />
              Back to portal
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
