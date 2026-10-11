import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleGate } from "@/features/auth/RoleGate";
import { assessmentsService } from "@/services/assessments";
import type { Assessment } from "@/types/assessment";
import { formatDate } from "@/lib/format";

const STATUS_TONE: Record<string, "neutral" | "warning" | "success" | "info"> =
  {
    draft: "neutral",
    open: "info",
    closed: "success",
  };

export default function AssessmentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    assessmentsService.get(id).then((a) => {
      setAssessment(a);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await assessmentsService.remove(id);
      navigate(-1);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!assessment) {
    return (
      <EmptyState
        title="Assessment not found"
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
        title={`${assessment.className} — ${assessment.subjectName}`}
        description={`${assessment.termName} · ${assessment.academicYear}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <RoleGate resource="assessments" action="update">
              <Link to="edit">
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </RoleGate>
            <RoleGate resource="assessments" action="delete">
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
          <CardHeader title="Assessment details" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Class" value={assessment.className} />
            <Field
              label="Subject"
              value={`${assessment.subjectCode} — ${assessment.subjectName}`}
            />
            <Field label="Term" value={assessment.termName} />
            <Field label="Academic year" value={assessment.academicYear} />
            <Field label="Teacher" value={assessment.teacherName ?? "—"} />
            <Field
              label="Due date"
              value={assessment.dueDate ? formatDate(assessment.dueDate) : "—"}
            />
            <Field
              label="Assessment max score"
              value={String(assessment.maxAssessmentScore)}
            />
            <Field
              label="Exam max score"
              value={String(assessment.maxExamScore)}
            />
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500 mb-1">Status</div>
              <Badge tone={STATUS_TONE[assessment.status] ?? "neutral"}>
                {assessment.status}
              </Badge>
            </div>
            {assessment.notes && (
              <div className="sm:col-span-2">
                <div className="text-xs text-ink-500 mb-1">Notes</div>
                <div className="text-sm text-ink-900">{assessment.notes}</div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mark entry" />
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-ink-600">
              <ClipboardList className="h-4 w-4 text-brand-600" />
              <span>
                {assessment.status === "open"
                  ? "Ready for mark entry"
                  : assessment.status === "closed"
                    ? "Mark entry closed"
                    : "Not yet opened"}
              </span>
            </div>
            <p className="text-xs text-ink-500">
              Full mark-entry UI ships with the Mark Entry module in the next
              phase. This assessment will appear there for teachers.
            </p>
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete assessment?"
        message="This removes the assessment and its scores. Historical records are preserved in production."
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
