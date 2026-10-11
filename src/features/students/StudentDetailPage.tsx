import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  FileText,
  MessageSquare,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { studentsService } from "@/services/students";
import type { Student } from "@/types/student";
import { formatDate } from "@/lib/format";

export default function StudentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    studentsService.get(id).then((s) => {
      setStudent(s);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await studentsService.remove(id);
      navigate("/admin/students");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-ink-500">Loading…</div>;
  }

  if (!student) {
    return (
      <EmptyState
        title="Student not found"
        description="This record may have been removed."
        action={
          <Link to="/admin/students">
            <Button variant="secondary">Back to students</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={`${student.firstName} ${student.lastName}`}
        description={`${student.admissionNumber} · ${student.className}`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/admin/students">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>

            <Link to={`/admin/students/${student.id}/report`}>
              <Button variant="secondary" size="sm">
                <FileText className="h-4 w-4" />
                Report Card
              </Button>
            </Link>

            <Link to={`/admin/students/${student.id}/remarks`}>
              <Button variant="secondary" size="sm">
                <MessageSquare className="h-4 w-4" />
                Remarks
              </Button>
            </Link>

            <Link to="ledger">
              <Button variant="secondary" size="sm">
                <Wallet className="h-4 w-4" />
                Ledger
              </Button>
            </Link>

            <Link to={`/admin/students/${student.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </Link>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Student information" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Admission #" value={student.admissionNumber} mono />
            <Field
              label="Class"
              value={`${student.className}${student.stream ? ` (Stream ${student.stream})` : ""}`}
            />
            <Field label="Division" value={student.division.toUpperCase()} />
            <Field label="Academic year" value={student.academicYear} />
            <Field
              label="Date of birth"
              value={formatDate(student.dateOfBirth)}
            />
            <Field label="Gender" value={student.gender} capitalize />
            <Field label="Nationality" value={student.nationality} />
            <Field
              label="Admission date"
              value={formatDate(student.admissionDate)}
            />
            <Field
              label="Address"
              value={student.address}
              className="sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500 mb-1">Status</div>
              <Badge tone={student.status === "active" ? "success" : "neutral"}>
                {student.status}
              </Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Guardian" />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-50 text-brand-700 grid place-items-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium text-ink-900">
                  {student.guardian.fullName}
                </div>
                <div className="text-xs text-ink-500 capitalize">
                  {student.guardian.relationship}
                </div>
              </div>
            </div>
            <Field label="Phone" value={student.guardian.phone} />
            {student.guardian.email && (
              <Field label="Email" value={student.guardian.email} />
            )}
            <Field label="Address" value={student.guardian.address} />
            {student.guardian.isEmergencyContact && (
              <Badge tone="info">Emergency contact</Badge>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete student?"
        message="This will remove the student from the current list. In production, this is a soft-archive operation that preserves historical records."
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
