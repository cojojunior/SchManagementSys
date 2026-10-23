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
import { classesService } from "@/services/supabase/classes";
import { studentsService } from "@/services/supabase/student";
import type { SchoolClass } from "@/types/class";
import type { Student } from "@/types/student";

export default function ClassDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState<SchoolClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      classesService.get(id),
      studentsService.list({ classId: id, status: "active" }, 1, 200),
    ])
      .then(([classData, studentsData]) => {
        if (cancelled) return;
        setCls(classData);
        setStudents(studentsData.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
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
        <Card className="lg:col-span-1">
          <CardHeader title="Class information" />
          <CardBody className="grid gap-4 sm:grid-cols-1">
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
            <Field label="Enrolled students" value={String(students.length)} />
            <div>
              <div className="text-xs text-ink-500 mb-1">Status</div>
              <Badge tone={cls.status === "active" ? "success" : "neutral"}>
                {cls.status}
              </Badge>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Enrolled students"
            action={
              <span className="text-sm text-ink-500">
                {students.length} student{students.length === 1 ? "" : "s"}
              </span>
            }
          />
          <CardBody className="p-0">
            {students.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<Users className="h-5 w-5" />}
                  title="No students yet"
                  description="Students appear here once assigned to this class."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-ink-50 text-ink-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">
                        Name
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium">
                        Admission #
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium">
                        Gender
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-ink-50/60">
                        <td className="px-4 py-2 font-medium text-ink-900">
                          {st.firstName} {st.lastName}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-ink-500">
                          {st.admissionNumber}
                        </td>
                        <td className="px-4 py-2 text-ink-600 capitalize">
                          {st.gender}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
