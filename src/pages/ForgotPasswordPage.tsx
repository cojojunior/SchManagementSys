import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo,
      });
      // Always show success — never leak whether the email exists
      setSent(true);
    } catch (e) {
      // Also suppress errors to avoid leaking account existence
      setSent(true);
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
              {sent ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Mail className="h-6 w-6" />
              )}
            </div>
            <h1 className="mt-3 text-xl font-semibold">
              {sent ? "Check your email" : "Forgot your password?"}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              {sent
                ? "If an account exists for that email, we've sent a reset link."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                A reset link has been sent to <strong>{email}</strong>. Click
                the link in the email to set a new password.
              </div>
              <Link to="/login" className="block">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Email" required error={error ?? undefined}>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              </FormField>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={working || !email}>
                {working ? "Sending…" : "Send reset link"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-xs text-ink-500 inline-flex items-center gap-1 hover:text-ink-700">
                  <ArrowLeft className="h-3 w-3" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
