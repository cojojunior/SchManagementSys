import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, User } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleGate } from "@/features/auth/RoleGate";
import { staffService } from "@/services/staff";
import type { Staff } from "@/types/staff";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

export default function StaffDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    staffService.get(id).then((s) => {
      setStaff(s);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await staffService.remove(id);
      navigate(-1);
    } finally {
      setDeleting(false);
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
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmOpen(true)}>
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
          <CardHeader title="Portal access" />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-700 grid place-items-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-ink-900">
                  {staff.systemRole
                    ? ROLE_LABELS[staff.systemRole]
                    : "No portal access"}
                </div>
                <div className="text-xs text-ink-500">
                  Account status: {staff.accountStatus}
                </div>
              </div>
            </div>
            <p className="text-xs text-ink-500">
              Role assignment and account provisioning are managed by the Super
              Admin in the Users &amp; Roles module (later phase).
            </p>
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
            <div className="sm:col-span-3">
              <div className="text-xs text-ink-500 mb-1">Account status</div>
              <Badge
                tone={staff.accountStatus === "active" ? "success" : "neutral"}>
                {staff.accountStatus}
              </Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete staff member?"
        message="In production this is a soft-archive. Historical teaching assignments and results tied to this staff member are preserved."
        confirmLabel="Delete"
        danger
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
