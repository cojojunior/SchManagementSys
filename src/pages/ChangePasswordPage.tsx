import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/features/auth/AuthContext";
import { requireSupabase } from "@/lib/supabase";
import { ROLE_HOME, type Role } from "@/lib/constants";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const forced = user?.mustChangePassword === true;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [success, setSuccess] = useState(false);

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
      const supabase = requireSupabase();

      const {
        data: { user: current },
      } = await supabase.auth.getUser();
      if (!current?.email) {
        setError("Session expired. Please sign in again.");
        return;
      }

      // Only verify the current password if the user is doing a voluntary change
      if (!forced) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: current.email,
          password: currentPassword,
        });
        if (verifyError) {
          setError("Current password is incorrect.");
          return;
        }
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Clear the forced flag if set
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", current.id);

      // Audit
      await supabase.from("audit_log").insert({
        actor_id: current.id,
        actor_name: current.email,
        action: "password_changed",
        entity: "profiles",
        entity_id: current.id,
        after_value: { forced },
      });

      setSuccess(true);
    } finally {
      setWorking(false);
    }
  }

  function handleSuccessClose() {
    setSuccess(false);
    const role = user?.role as Role | undefined;
    navigate(role ? ROLE_HOME[role] : "/", { replace: true });
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-semibold">
              {forced ? "Set a new password" : "Change password"}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              {forced
                ? "Your account is set with a temporary password. Choose a new one."
                : "Enter your current password, then choose a new one."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!forced && (
              <FormField label="Current password" required>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </FormField>
            )}

            <FormField
              label="New password"
              required
              hint="At least 8 characters">
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </FormField>

            <FormField label="Confirm new password" required>
              <PasswordInput
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
                (!forced && !currentPassword) ||
                !newPassword ||
                !confirmPassword
              }>
              {working
                ? "Saving…"
                : forced
                  ? "Set new password"
                  : "Update password"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <SuccessDialog
        open={success}
        onClose={handleSuccessClose}
        title="Password created successfully"
        message="You're all set. Click OK to continue to your dashboard."
        buttonLabel="OK"
      />
    </div>
  );
}
