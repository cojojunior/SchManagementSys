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
import { subjectsService } from "@/services/subjects";
import type { Subject } from "@/types/subjects";

const DIVISION_LABELS: Record<string, string> = {
  nursery: "Nursery",
  kg: "KG",
  primary: "Primary",
  jhs: "JHS",
};

export default function SubjectDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setLoading(true);
    subjectsService.get(id).then((s) => {
      setSubject(s);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await subjectsService.remove(id);
      navigate(-1);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <div className="text-sm text-ink-500">Loading…</div>;

  if (!subject) {
    return (
      <EmptyState
        title="Subject not found"
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
        title={subject.name}
        description={`Code: ${subject.code}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <RoleGate resource="subjects" action="update">
              <Link to="edit">
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            </RoleGate>
            <RoleGate resource="subjects" action="delete">
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
        <CardHeader title="Subject information" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" value={subject.code} mono />
          <Field label="Name" value={subject.name} />
          <div>
            <div className="text-xs text-ink-500 mb-1">Divisions</div>
            <div className="flex flex-wrap gap-1">
              {subject.divisions.map((d) => (
                <Badge key={d} tone="info">
                  {DIVISION_LABELS[d] ?? d}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-ink-500 mb-1">Type</div>
            <Badge tone={subject.isCore ? "brand" : "neutral"}>
              {subject.isCore ? "Core" : "Elective"}
            </Badge>
          </div>
          <div>
            <div className="text-xs text-ink-500 mb-1">Status</div>
            <Badge tone={subject.status === "active" ? "success" : "neutral"}>
              {subject.status}
            </Badge>
          </div>
          {subject.description && (
            <div className="sm:col-span-2">
              <div className="text-xs text-ink-500 mb-1">Description</div>
              <div className="text-sm text-ink-900">{subject.description}</div>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete subject?"
        message="This removes the subject from the current list. In production, this is a soft-archive that preserves historical results."
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
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-ink-500 mb-1">{label}</div>
      <div className={`text-sm text-ink-900 ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
