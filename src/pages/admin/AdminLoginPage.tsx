import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
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
        setError("Invalid credentials.");
        return;
      }

      const role = data.user.app_metadata?.role;

      if (role !== "super_admin") {
        await supabase.auth.signOut();
        setError("Unauthorized. This portal is for Super Admins only.");
        return;
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-slate-900">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardBody className="space-y-6 p-8">
          <div className="text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-500/20 text-indigo-400 grid place-items-center">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-4 text-xl font-bold text-white">
              System Administrator
            </h1>
            <p className="text-sm text-slate-400 mt-1">Restricted Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Changed label to a string, added a custom class to target it via CSS below */}
            <FormField
              label="Email"
              required
              className="[&_label]:text-slate-300">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                autoComplete="username"
              />
            </FormField>

            <FormField
              label="Password"
              required
              className="[&_label]:text-slate-300">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                autoComplete="current-password"
              />
            </FormField>

            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              size="lg"
              disabled={working || !email || !password}>
              {working ? "Authenticating…" : "Secure Login"}
            </Button>
          </form>

          <div className="text-center pt-2">
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to main portal
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
