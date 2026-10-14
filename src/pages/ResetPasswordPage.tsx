import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [success, setSuccess] = useState(false);

  // Supabase places the recovery token in the URL fragment (#access_token=...)
  // and `onAuthStateChange` with the PASSWORD_RECOVERY event fires when the
  // token is detected. We listen for that.
useEffect(() => {
  const client = supabase;
  if (!client) {
    setError("Supabase is not configured.");
    return;
  }

  let cancelled = false;

  // Supabase places the recovery token in the URL fragment (#access_token=...).
  // The SDK picks it up and establishes a short-lived session, firing
  // a PASSWORD_RECOVERY event. We poll briefly for that session.
  const startedAt = Date.now();
  const MAX_WAIT_MS = 3000;
  const POLL_INTERVAL_MS = 200;

  async function check() {
    const { data } = await client!.auth.getSession();
    if (cancelled) return;

    if (data.session) {
      setReady(true);
      return;
    }
    if (Date.now() - startedAt >= MAX_WAIT_MS) {
      setError(
        "This reset link is invalid or has expired. Please request a new one.",
      );
      return;
    }
    setTimeout(check, POLL_INTERVAL_MS);
  }

  void check();

  return () => {
    cancelled = true;
  };
}, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setWorking(true);
    try {
      if (!supabase) {
        setError("Supabase is not configured.");
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) {
        setError(updateErr.message);
        return;
      }

      // If the user was flagged for a forced change, clear it now.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ must_change_password: false })
          .eq("id", user.id);

        await supabase.from("audit_log").insert({
          actor_id: user.id,
          actor_name: user.email,
          action: "password_reset_completed",
          entity: "profiles",
          entity_id: user.id,
        });
      }

      setSuccess(true);
    } finally {
      setWorking(false);
    }
  }

  function handleSuccessClose() {
    setSuccess(false);
    // Sign out so the user re-authenticates with the new password
    supabase?.auth.signOut().then(() => {
      navigate("/login", { replace: true });
    });
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-semibold">Set a new password</h1>
            <p className="text-sm text-ink-500 mt-1">
              Choose a strong password for your account
            </p>
          </div>

          {!ready && !error && (
            <div className="text-sm text-ink-500 text-center">
              Verifying your reset link…
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {ready && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="New password"
                required
                hint="At least 8 characters">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Confirm password" required>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </FormField>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={working || !newPassword || !confirmPassword}>
                {working ? "Saving…" : "Reset password"}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <SuccessDialog
        open={success}
        onClose={handleSuccessClose}
        title="Password reset successfully"
        message="You can now log in with your new password."
        buttonLabel="Go to sign in"
      />
    </div>
  );
}
