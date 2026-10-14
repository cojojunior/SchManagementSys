import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { studentAuthService } from "@/services/supabase/student-auth";

export default function StudentLoginPage() {
  const navigate = useNavigate();
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      const result = await studentAuthService.login(
        admissionNumber.trim().toUpperCase(),
        code,
      );

      if (!result.ok) {
        if (result.needsActivation) {
          setError(
            "This account hasn't been activated yet. Please activate it first.",
          );
          return;
        }
        setError(result.reason);
        return;
      }

      navigate("/student", { replace: true });
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
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-semibold">Student Sign In</h1>
            <p className="text-sm text-ink-500 mt-1">
              Your admission number + 4-digit code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Admission number" required hint="e.g. SUAC001">
              <Input
                value={admissionNumber}
                onChange={(e) =>
                  setAdmissionNumber(e.target.value.toUpperCase())
                }
                placeholder="SUAC001"
                autoComplete="username"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="font-mono uppercase"
              />
            </FormField>

            <FormField label="4-digit code" required>
              <PasswordInput
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="font-mono text-2xl tracking-widest text-center pr-10"
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
              disabled={working || !admissionNumber || code.length !== 4}>
              {working ? "Signing in…" : "Sign in"}
            </Button>

            <div className="text-center text-sm text-ink-500">
              First time here?{" "}
              <Link
                to="/student/activate"
                className="text-brand-600 hover:underline">
                Activate your account
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
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
