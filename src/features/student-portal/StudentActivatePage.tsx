import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { studentAuthService } from "@/services/supabase/student-auth";

export default function StudentActivatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 state
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Verified student
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [verifiedAdmissionNumber, setVerifiedAdmissionNumber] = useState("");
  const [proof, setProof] = useState("");

  // Step 2 state
  const [code, setCode] = useState("");
  const [codeConfirm, setCodeConfirm] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      const result = await studentAuthService.verifyActivation(
        admissionNumber.trim().toUpperCase(),
        dateOfBirth,
      );
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      setStudentId(result.studentId);
      setFullName(result.fullName);
      setVerifiedAdmissionNumber(result.admissionNumber);
      setProof(result.proof);
      setStep(2);
    } finally {
      setWorking(false);
    }
  }

  async function handleSetCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (code.length !== 4) {
      setError("Code must be exactly 4 digits.");
      return;
    }
    if (/(\d)\1{3}/.test(code)) {
      setError("Code cannot be four identical digits.");
      return;
    }
    if (code !== codeConfirm) {
      setError("Codes do not match.");
      return;
    }

    setWorking(true);
    try {
      const result = await studentAuthService.completeActivation(
        studentId,
        proof,
        code,
      );
      if (!result.ok) {
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
      <Card className="w-full max-w-lg">
        <CardBody className="space-y-6 p-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-semibold">
              {step === 1 ? "Activate Your Account" : "Choose Your Code"}
            </h1>
            <p className="text-sm text-ink-500 mt-1">
              {step === 1
                ? "Verify your identity to get started"
                : "Pick a 4-digit code you'll use to sign in"}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            <div
              className={`h-1.5 w-12 rounded-full ${
                step >= 1 ? "bg-brand-600" : "bg-ink-200"
              }`}
            />
            <div
              className={`h-1.5 w-12 rounded-full ${
                step >= 2 ? "bg-brand-600" : "bg-ink-200"
              }`}
            />
          </div>

          {/* Step 1 — verify */}
          {step === 1 && (
            <form onSubmit={handleVerify} className="space-y-4">
              <FormField label="Admission number" required hint="e.g. SUAC001">
                <Input
                  value={admissionNumber}
                  onChange={(e) =>
                    setAdmissionNumber(e.target.value.toUpperCase())
                  }
                  placeholder="SUAC001"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="font-mono uppercase"
                />
              </FormField>

              <FormField label="Date of birth" required>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
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
                disabled={working || !admissionNumber || !dateOfBirth}>
                {working ? "Verifying…" : "Verify identity"}
              </Button>

              <div className="text-center text-sm text-ink-500">
                Already activated?{" "}
                <Link
                  to="/student/login"
                  className="text-brand-600 hover:underline">
                  Sign in
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
          )}

          {/* Step 2 — set code */}
          {step === 2 && (
            <form onSubmit={handleSetCode} className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                Welcome, <strong>{fullName}</strong>
                <div className="text-xs text-emerald-700 mt-0.5 font-mono">
                  {verifiedAdmissionNumber}
                </div>
              </div>

              <FormField
                label="Choose a 4-digit code"
                required
                hint="Avoid obvious patterns like 1234 or 0000">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-2xl tracking-widest text-center"
                />
              </FormField>

              <FormField label="Confirm code" required>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={codeConfirm}
                  onChange={(e) =>
                    setCodeConfirm(e.target.value.replace(/\D/g, ""))
                  }
                  className="font-mono text-2xl tracking-widest text-center"
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
                  working || code.length !== 4 || codeConfirm.length !== 4
                }>
                {working ? "Activating…" : "Activate account"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="text-xs text-ink-500 hover:text-ink-700">
                  ← Back to identity check
                </button>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
