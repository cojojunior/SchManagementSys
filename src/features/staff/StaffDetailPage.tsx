import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  ShieldCheck,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Dialog } from "@/components/ui/Dialog";
import { SuccessDialog } from "@/components/ui/SuccessDialog";
import { FormField } from "@/components/ui/FormField";
import { RoleGate } from "@/features/auth/RoleGate";
import { staffService } from "@/services/supabase/staff";
import { usersService } from "@/services/supabase/users";
import type { Staff } from "@/types/staff";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

type StaffRole = "headmaster" | "teacher" | "secretary";

export default function StaffDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWithLogin, setDeleteWithLogin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [accessOpen, setAccessOpen] = useState(false);
  const [accessRole, setAccessRole] = useState<StaffRole>("teacher");
  const [accessWorking, setAccessWorking] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetWorking, setResetWorking] = useState(false);

  const [success, setSuccess] = useState<{
    title: string;
    message: string;
  } | null>(null);

  async function reload() {
    setLoading(true);
    const s = await staffService.get(id);
    setStaff(s);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openDelete() {
    setDeleteWithLogin(false);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await staffService.remove(id, { deleteLogin: deleteWithLogin });
      setDeleteOpen(false);
      navigate(-1);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  async function handleGiveAccess() {
    if (!staff) return;
    setAccessWorking(true);
    try {
      await usersService.provisionUser({
        fullName: `${staff.firstName} ${staff.lastName}`,
        email: staff.email.toLowerCase().trim(),
        password: "Password1",
        role: accessRole,
        staffId: staff.id,
      });
      setAccessOpen(false);
      setSuccess({
        title: "Portal access created",
        message: `${staff.firstName} ${staff.lastName} can now sign in with ${staff.email} using Password1 as the temporary password.`,
      });
      await reload();
    } finally {
      setAccessWorking(false);
    }
  }

  async function handleResetPassword() {
    if (!staff?.loginUserId) return;
    setResetWorking(true);
    try {
      await usersService.resetToDefault(staff.loginUserId);
      setResetOpen(false);
      setSuccess({
        title: "Password reset",
        message: `${staff.firstName}'s password has been reset to Password1. They will be prompted to set a new one on their next login.`,
      });
    } finally {
      setResetWorking(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!staff) {
    return (
      <EmptyState
        title="Staff member not found"
        action={
          <Link to="..">
            <Button variant="secondary">Back</Button>
          </Link>
        }
      />
    );
  }

  const hasLogin = Boolean(staff.loginUserId);

  return (
    <>
      <PageHeader
        title={`${staff.firstName} ${staff.lastName}`}
        description={`${staff.staffId} · ${staff.jobTitle}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <RoleGate resource="staff" action="update">
              <Link to="edit">
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </RoleGate>
            <RoleGate resource="staff" action="delete">
              <Button variant="danger" size="sm" onClick={openDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </RoleGate>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Personal information" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Staff ID" value={staff.staffId} mono />
            <Field
              label="Date of birth"
              value={formatDate(staff.dateOfBirth)}
            />
            <Field label="Gender" value={staff.gender} capitalize />
            <Field label="Phone" value={staff.phone} />
            <Field label="Email" value={staff.email} />
            <Field
              label="Address"
              value={staff.address}
              className="sm:col-span-2"
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <span>Portal access</span>
              </div>
            }
          />
          <CardBody className="space-y-4">
            {hasLogin ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-700 grid place-items-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900 truncate">
                      {staff.systemRole
                        ? ROLE_LABELS[staff.systemRole]
                        : "Login active"}
                    </div>
                    <div className="text-xs text-ink-500 truncate">
                      {staff.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="success">Login active</Badge>
                  <Badge
                    tone={
                      staff.accountStatus === "active" ? "success" : "neutral"
                    }>
                    {staff.accountStatus}
                  </Badge>
                </div>

                <RoleGate resource="users" action="update">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setResetOpen(true)}>
                    <RotateCcw className="h-4 w-4" />
                    Reset password
                  </Button>
                </RoleGate>

                <p className="text-xs text-ink-500">
                  The user signs in at <code className="font-mono">/login</code>{" "}
                  with their email. Password resets to{" "}
                  <code className="font-mono">Password1</code> and they must
                  change it on next login.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-ink-100 text-ink-500 grid place-items-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-ink-900">No login yet</div>
                    <div className="text-xs text-ink-500">
                      This staff member cannot sign in
                    </div>
                  </div>
                </div>

                <p className="text-xs text-ink-500">
                  Give {staff.firstName} access to the portal. They&apos;ll sign
                  in with <strong>{staff.email}</strong> using{" "}
                  <code className="font-mono">Password1</code> and must change
                  it on first login.
                </p>

                <RoleGate resource="users" action="create">
                  <Button
                    className="w-full"
                    onClick={() => {
                      const t = staff.jobTitle.toLowerCase();
                      if (
                        t.includes("headmaster") ||
                        t.includes("head master")
                      ) {
                        setAccessRole("headmaster");
                      } else if (t.includes("secretary")) {
                        setAccessRole("secretary");
                      } else {
                        setAccessRole("teacher");
                      }
                      setAccessOpen(true);
                    }}>
                    <UserPlus className="h-4 w-4" />
                    Give portal access
                  </Button>
                </RoleGate>
              </>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Employment" />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            <Field label="Job title" value={staff.jobTitle} />
            <Field
              label="Category"
              value={
                staff.category === "teaching" ? "Teaching" : "Non-teaching"
              }
            />
            <Field label="Department" value={staff.department ?? "—"} />
            <Field
              label="Employment status"
              value={
                EMPLOYMENT_LABELS[staff.employmentStatus] ??
                staff.employmentStatus
              }
            />
            <Field label="Date hired" value={formatDate(staff.dateHired)} />
            <Field label="Qualification" value={staff.qualification ?? "—"} />
          </CardBody>
        </Card>
      </div>

      {/* Delete dialog with two options */}
      <Dialog
        open={deleteOpen}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setDeleteError(null);
          }
        }}
        title="Delete staff member?"
        description={`This will remove ${staff.firstName} ${staff.lastName} from the staff list.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteError(null);
              }}
              disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </>
        }>
        <div className="space-y-4">
          {hasLogin ? (
            <>
              <p className="text-sm text-ink-700">
                This staff member has a login ({staff.email}). What should
                happen to it?
              </p>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  deleteWithLogin
                    ? "border-ink-200 hover:bg-ink-50"
                    : "border-brand-400 bg-brand-50/60",
                )}>
                <input
                  type="radio"
                  name="delete-mode"
                  checked={!deleteWithLogin}
                  onChange={() => setDeleteWithLogin(false)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="font-medium text-ink-900">
                    Delete staff record only
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    The login stays active. They can still sign in, but they
                    won&apos;t appear in the staff list.
                  </div>
                </div>
              </label>

              <label
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  deleteWithLogin
                    ? "border-red-400 bg-red-50/60"
                    : "border-red-200 hover:bg-red-50/40",
                )}>
                <input
                  type="radio"
                  name="delete-mode"
                  checked={deleteWithLogin}
                  onChange={() => setDeleteWithLogin(true)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="font-medium text-ink-900">
                    Delete staff record AND login
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    Permanently removes the account. They can no longer sign in
                    with {staff.email}. Their historical records (assigned
                    classes, entered scores) are preserved.
                  </div>
                </div>
              </label>
            </>
          ) : (
            <p className="text-sm text-ink-700">
              This staff member has no login. Deleting will only remove the
              staff record.
            </p>
          )}

          {deleteError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {deleteError}
            </div>
          )}
        </div>
      </Dialog>

      {/* Give portal access dialog */}
      <Dialog
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
        title="Give portal access"
        description={`${staff.firstName} will sign in with ${staff.email}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAccessOpen(false)}
              disabled={accessWorking}>
              Cancel
            </Button>
            <Button onClick={handleGiveAccess} disabled={accessWorking}>
              {accessWorking ? "Creating…" : "Create login"}
            </Button>
          </>
        }>
        <div className="space-y-4">
          <FormField label="Role" required>
            <Select
              value={accessRole}
              onChange={(e) => setAccessRole(e.target.value as StaffRole)}>
              <option value="headmaster">Headmaster</option>
              <option value="teacher">Teacher</option>
              <option value="secretary">Secretary</option>
            </Select>
          </FormField>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            <div>
              <strong>Login details</strong>
            </div>
            <div className="mt-1">
              Email: <code className="font-mono">{staff.email}</code>
            </div>
            <div>
              Temporary password: <code className="font-mono">Password1</code>
            </div>
            <div className="mt-1 text-emerald-700">
              They must change the password on first login.
            </div>
          </div>
        </div>
      </Dialog>

      {/* Reset password confirmation */}
      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleResetPassword}
        loading={resetWorking}
        title="Reset password?"
        message={`${staff.firstName}'s password will be set to Password1 and they will be forced to choose a new one on their next login.`}
        confirmLabel="Reset password"
      />

      {/* Success dialog */}
      <SuccessDialog
        open={success !== null}
        onClose={() => setSuccess(null)}
        title={success?.title ?? ""}
        message={success?.message ?? ""}
      />
    </>
  );
}

function Field({
  label,
  value,
  mono,
  capitalize,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div
        className={[
          "text-sm text-ink-900",
          mono ? "font-mono" : "",
          capitalize ? "capitalize" : "",
        ].join(" ")}>
        {value}
      </div>
    </div>
  );
}
