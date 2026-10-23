import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { supabase } from "@/lib/supabase";

export default function HeadmasterLoginPage() {
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
      if (!supabase) throw new Error("Supabase not configured.");
      await supabase.auth.signOut();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (signInError || !data.user) {
        setError("Invalid email or password.");
        return;
      }

      const role = data.user.app_metadata?.role;
      if (role !== "headmaster") {
        await supabase.auth.signOut();
        setError(
          "Unauthorized. You must be a Headmaster to access this portal.",
        );
        return;
      }

      navigate("/headmaster", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-amber-50 via-white to-amber-50">
      <Card className="w-full max-w-md border-amber-200">
        <CardBody className="space-y-6 p-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-white border border-amber-100 grid place-items-center shadow-sm overflow-hidden p-1">
              <img
                src="/SUAC-LOGO.svg"
                alt="Logo"
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="mt-5 text-xl font-bold text-amber-900">
              Headmaster Portal
            </h1>
            <p className="text-sm text-amber-700/70 mt-1">
              Review & publish results
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField label="Password" required>
              <PasswordInput
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
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              size="lg"
              disabled={working || !email || !password}>
              {working ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs text-amber-700 hover:text-amber-900 inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to portal
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
