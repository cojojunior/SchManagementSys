import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleGate } from "@/features/auth/RoleGate";
import { teachingAssignmentsService } from "@/services/supabase/teaching-assignments";
import type { TeachingAssignment } from "@/types/teaching-assignment";

export default function AssignmentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<TeachingAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    teachingAssignmentsService.get(id).then((a) => {
      setAssignment(a);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await teachingAssignmentsService.remove(id);
      navigate(-1);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!assignment) {
    return (
      <EmptyState
        title="Assignment not found"
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
        title={`${assignment.staffName} → ${assignment.className}`}
        description={`${assignment.subjectName} · ${assignment.academicYear}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <RoleGate resource="teaching_assignments" action="update">
              <Link to="edit">
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </RoleGate>
            <RoleGate resource="teaching_assignments" action="delete">
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

      <Card>
        <CardHeader title="Assignment details" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Teacher" value={assignment.staffName} />
          <Field label="Class" value={assignment.className} />
          <Field
            label="Subject"
            value={`${assignment.subjectCode} — ${assignment.subjectName}`}
          />
          <Field label="Academic year" value={assignment.academicYear} />
          <Field
            label="Periods per week"
            value={
              assignment.periodsPerWeek
                ? String(assignment.periodsPerWeek)
                : "—"
            }
          />
          <div>
            <div className="text-xs text-ink-500 mb-1">Status</div>
            <Badge tone={assignment.isActive ? "success" : "neutral"}>
              {assignment.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {assignment.notes && (
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500 mb-1">Notes</div>
              <div className="text-sm text-ink-900">{assignment.notes}</div>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete assignment?"
        message="This removes the teacher's assignment to this subject and class. In production, historical assignments are preserved."
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
