import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      const result = await signIn(email.trim(), password);
      if (!result.ok) {
        setError(result.reason ?? "Sign-in failed");
        return;
      }

      const { data } = supabase
        ? await supabase.auth.getSession()
        : { data: { session: null } };
      const role = data.session?.user.app_metadata?.role as Role | undefined;
      navigate(role ? ROLE_HOME[role] : "/admin", { replace: true });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-5">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center text-lg font-bold">
              SA
            </div>
            <h1 className="mt-3 text-xl font-semibold">Supreme Academy</h1>
            <p className="text-sm text-ink-500">Staff sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" required>
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@supreme.edu.gh"
              />
            </FormField>

            <FormField label="Password" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={working || !email || !password}>
              {working ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="text-center text-sm space-y-2 pt-4 border-t border-ink-200">
            <div className="text-ink-500">Are you a student?</div>
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/student/login"
                className="text-brand-600 hover:underline">
                Sign in
              </Link>
              <span className="text-ink-300">·</span>
              <Link
                to="/student/activate"
                className="text-brand-600 hover:underline">
                Activate account
              </Link>
            </div>
          </div>
          <div className="text-center text-xs text-ink-500 pt-4 border-t border-ink-200 flex items-center justify-center gap-3">
            <Link to="/terms" className="hover:text-ink-700">
              Terms & Conditions
            </Link>
            <span className="text-ink-300">·</span>
            <Link to="/privacy" className="hover:text-ink-700">
              Privacy Policy
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
