import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { studentAuthService } from "@/services/student-auth";
import type { Student } from "@/types/student";

export default function StudentActivatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      const result = await studentAuthService.verifyIdentity(
        admissionNumber.trim(),
        dateOfBirth,
      );
      if (!result.ok) {
        setError(result.reason);
        return;
      }
      if (studentAuthService.hasActivated(result.student.id)) {
        setError(
          "This account is already activated. Please sign in with your PIN.",
        );
        return;
      }
      setStudent(result.student);
      setStep(2);
    } finally {
      setWorking(false);
    }
  }

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setError(null);
    if (pin.length !== 4) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== pinConfirm) {
      setError("PINs do not match.");
      return;
    }
    setWorking(true);
    try {
      const result = await studentAuthService.setLoginPin(student.id, pin);
      if (!result.ok) {
        setError(result.reason ?? "Could not save PIN.");
        return;
      }
      navigate("/student/login", { state: { justActivated: true } });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-brand-50 via-white to-ink-50">
      <Card className="w-full max-w-lg">
        <CardBody className="space-y-6 p-6">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="mt-3 text-xl font-semibold">Student Activation</h1>
            <p className="text-sm text-ink-500 mt-1">
              {step === 1
                ? "Verify your identity to activate your account"
                : "Choose a 4-digit login PIN"}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <FormField label="Admission number" required>
                <Input
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="e.g. SA-2024-0001"
                  autoComplete="off"
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
                {working ? "Verifying…" : "Verify"}
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
                  to="/login"
                  className="text-xs text-ink-500 inline-flex items-center gap-1 hover:text-ink-700">
                  <ArrowLeft className="h-3 w-3" />
                  Back to portal
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSetPin} className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                Welcome,{" "}
                <strong>
                  {student?.firstName} {student?.lastName}
                </strong>
                . Choose a memorable 4-digit PIN. You&apos;ll use it every time
                you sign in.
              </div>

              <FormField
                label="4-digit PIN"
                required
                hint="Avoid obvious patterns like 1234 or 0000">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="font-mono text-2xl tracking-widest text-center"
                />
              </FormField>

              <FormField label="Confirm PIN" required>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinConfirm}
                  onChange={(e) =>
                    setPinConfirm(e.target.value.replace(/\D/g, ""))
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
                  working || pin.length !== 4 || pinConfirm.length !== 4
                }>
                {working ? "Saving…" : "Activate account"}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
