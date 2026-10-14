import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Ban, CheckCircle2, Pause, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { RoleGate } from "@/features/auth/RoleGate";
import { usersService } from "@/services/supabase/users";
import type { UserProfile, RoleChangeLogEntry } from "@/types/users";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type PendingAction = "activate" | "suspend" | "archive" | null;

export default function UserDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<RoleChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  async function reload() {
    setLoading(true);
    const [u, h] = await Promise.all([
      usersService.get(id),
      usersService.roleHistory(id),
    ]);
    setUser(u);
    setHistory(h);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusAction() {
    if (!pending || !user) return;
    setWorking(true);
    try {
      const status =
        pending === "activate"
          ? "active"
          : pending === "suspend"
            ? "suspended"
            : "archived";
      await usersService.setStatus(user.id, status);
      setPending(null);
      await reload();
    } finally {
      setWorking(false);
    }
  }

  async function handleResetPassword() {
    if (!user) return;
    setWorking(true);
    try {
      await usersService.resetToDefault(user.id);
      setResetOpen(false);
      setResetSuccess(true);
      await reload();
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;
  if (!user) {
    return (
      <EmptyState
        title="User not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={user.fullName || user.email}
        description={user.email}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <RoleGate resource="users" action="update">
              {user.role !== "super_admin" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setResetOpen(true)}>
                  <RotateCcw className="h-4 w-4" />
                  Reset password
                </Button>
              )}

              {user.status !== "active" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPending("activate")}>
                  <CheckCircle2 className="h-4 w-4" />
                  Activate
                </Button>
              )}
              {user.status === "active" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPending("suspend")}>
                  <Pause className="h-4 w-4" />
                  Suspend
                </Button>
              )}
              <Button
                variant="danger"
                size="sm"
                onClick={() => setPending("archive")}>
                <Ban className="h-4 w-4" />
                Archive
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Account" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={user.fullName || "—"} />
            <Field label="Email" value={user.email} />
            <div>
              <div className="text-xs text-ink-500 mb-1">Role</div>
              <Badge tone="brand">{ROLE_LABELS[user.role]}</Badge>
            </div>
            <div>
              <div className="text-xs text-ink-500 mb-1">Status</div>
              <Badge
                tone={
                  user.status === "active"
                    ? "success"
                    : user.status === "suspended"
                      ? "warning"
                      : "neutral"
                }>
                {user.status}
              </Badge>
            </div>
            <Field
              label="Last login"
              value={user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
            />
            <Field label="Created" value={formatDate(user.createdAt)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Password" />
          <CardBody className="space-y-3 text-sm">
            <p className="text-ink-600">
              Reset this user&apos;s password back to{" "}
              <code className="text-xs bg-ink-100 px-1.5 py-0.5 rounded font-mono">
                Password1
              </code>
              . They&apos;ll be forced to choose a new one on their next login.
            </p>
            <RoleGate resource="users" action="update">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setResetOpen(true)}
                disabled={user.role === "super_admin"}>
                <RotateCcw className="h-4 w-4" />
                Reset password
              </Button>
            </RoleGate>
            {user.role === "super_admin" && (
              <p className="text-xs text-ink-500">
                Super Admin passwords can only be reset in Supabase.
              </p>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Role & status history"
            description={`${history.length} change${history.length === 1 ? "" : "s"} recorded`}
          />
          <CardBody className="p-0">
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-ink-500">
                No changes recorded yet.
              </div>
            ) : (
              <ul className="divide-y divide-ink-200">
                {history.map((h) => (
                  <li key={h.id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm">
                          {h.previousRole && h.previousRole !== h.newRole && (
                            <span>
                              <span className="text-ink-500">
                                {ROLE_LABELS[h.previousRole]}
                              </span>
                              {" → "}
                            </span>
                          )}
                          <span className="font-medium text-ink-900">
                            {ROLE_LABELS[h.newRole]}
                          </span>
                          {h.previousStatus &&
                            h.previousStatus !== h.newStatus && (
                              <span className="text-ink-500">
                                {" "}
                                · status {h.previousStatus} → {h.newStatus}
                              </span>
                            )}
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5">
                          {h.actorName}
                          {h.reason && ` · ${h.reason}`}
                        </div>
                      </div>
                      <div className="text-xs text-ink-500 shrink-0">
                        {new Date(h.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={handleStatusAction}
        loading={working}
        title={
          pending === "activate"
            ? "Activate this account?"
            : pending === "suspend"
              ? "Suspend this account?"
              : "Archive this account?"
        }
        message={
          pending === "activate"
            ? "The user will be able to sign in again."
            : pending === "suspend"
              ? "The user will be blocked from signing in until reactivated."
              : "Archived accounts cannot sign in and are hidden from normal lists."
        }
        confirmLabel={
          pending === "activate"
            ? "Activate"
            : pending === "suspend"
              ? "Suspend"
              : "Archive"
        }
        danger={pending === "archive"}
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetPassword}
        loading={working}
        title="Reset password?"
        message={`The password will be reset to "Password1" and the user will be forced to create a new one on their next login.`}
        confirmLabel="Reset password"
      />

      <SuccessDialog
        open={resetSuccess}
        onClose={() => setResetSuccess(false)}
        title="Password reset"
        message="The user's password has been reset to Password1. They will be prompted to set a new password when they next sign in."
      />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className="text-sm text-ink-900">{value}</div>
    </div>
  );
}
