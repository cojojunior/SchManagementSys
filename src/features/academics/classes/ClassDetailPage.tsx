import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleGate } from "@/features/auth/RoleGate";
import { classesService } from "@/services/classes";
import type { SchoolClass } from "@/types/class";

export default function ClassDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    classesService.get(id).then((c) => {
      setCls(c);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await classesService.remove(id);
      navigate(-1);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!cls) {
    return (
      <EmptyState
        title="Class not found"
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
        title={cls.name}
        description={`${cls.division.toUpperCase()} · ${cls.academicYear}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <RoleGate resource="classes" action="update">
              <Link to="edit">
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </RoleGate>
            <RoleGate resource="classes" action="delete">
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
          <CardHeader title="Class information" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={cls.name} />
            <Field label="Division" value={cls.division.toUpperCase()} />
            <Field label="Level" value={String(cls.level)} />
            <Field label="Stream" value={cls.stream ?? "—"} />
            <Field
              label="Class teacher"
              value={cls.classTeacherName ?? "Unassigned"}
            />
            <Field label="Academic year" value={cls.academicYear} />
            <Field label="Capacity" value={String(cls.capacity)} />
            <Field label="Enrolled students" value={String(cls.studentCount)} />
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500 mb-1">Status</div>
              <Badge tone={cls.status === "active" ? "success" : "neutral"}>
                {cls.status}
              </Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Enrolled students"
            action={
              <Link to="/admin/students">
                <Button variant="ghost" size="sm">
                  View all
                </Button>
              </Link>
            }
          />
          <CardBody>
            {cls.studentCount === 0 ? (
              <EmptyState
                icon={<Users className="h-5 w-5" />}
                title="No students yet"
                description="Students appear here once assigned to this class."
              />
            ) : (
              <p className="text-sm text-ink-600">
                {cls.studentCount} student{cls.studentCount === 1 ? "" : "s"}{" "}
                enrolled. Full list arrives with the roster view in a later
                phase.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete class?"
        message="In production this is a soft-archive that preserves historical records for enrolled students."
        confirmLabel="Delete"
        danger
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
