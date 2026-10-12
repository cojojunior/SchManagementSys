import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/features/auth/AuthContext";
import { requireSupabase } from "@/lib/supabase";
import { ROLE_HOME, type Role } from "@/lib/constants";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setWorking(true);
    try {
      const supabase = requireSupabase();

      // Verify the current password by re-authenticating.
      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      if (!current?.email) {
        setError("Session expired. Please sign in again.");
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: current.email,
        password: currentPassword,
      });
      if (verifyError) {
        setError("Current password is incorrect.");
        return;
      }

      // Update to the new password.
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Clear the must_change_password flag.
      const { error: flagError } = await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", current.id);
      if (flagError) {
        // Non-fatal — log it but continue
        console.warn("Could not clear flag:", flagError.message);
      }

      setDone(true);
      setTimeout(() => {
        const role = user?.role as Role | undefined;
        navigate(role ? ROLE_HOME[role] : "/", { replace: true });
      }, 1200);
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
              {done ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <KeyRound className="h-6 w-6" />
              )}
            </div>
            <h1 className="mt-3 text-xl font-semibold">
              {done ? "Password updated" : "Set a new password"}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              {done
                ? "Redirecting you now…"
                : "Choose a strong password to replace the temporary one"}
            </p>
          </div>

          {!done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Current password" required>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </FormField>
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
              <FormField label="Confirm new password" required>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
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
                disabled={
                  working ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }>
                {working ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
