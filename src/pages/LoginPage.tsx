import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { ROLES, ROLE_HOME, ROLE_LABELS, type Role } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";

export default function LoginPage() {
  const { signInAs } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("super_admin");

  function handleContinue() {
    signInAs(role);
    navigate(ROLE_HOME[role]);
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
            <p className="text-sm text-ink-500">
              Sign in to continue
              <span className="ml-1 text-ink-400">· demo mode</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sign in as</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full h-10 rounded-lg border border-ink-200 bg-white px-3 text-sm">
              {ROLES.filter((r) => r !== "student").map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <p className="text-xs text-ink-500">
              Real authentication is added in Phase 6. For now, pick a staff
              role to preview its portal.
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={handleContinue}>
            Continue
          </Button>

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
        </CardBody>
      </Card>
    </div>
  );
}
